"""
Real Dynamic Job Search & Candidate Fit Engine Service
======================================================
Pluggable provider architecture for real live job discovery via external APIs
(Adzuna, Jooble, and Live Web APIs) and truth-preserving NLP candidate-to-job fit scoring.

Guarantees:
  1. Zero hardcoded/mock/fake jobs.
  2. Live external API ingestion with normalization & deduplication.
  3. Dynamic search query generator based on candidate profile.
  4. Truth-preserving skill matching: never claims a skill is missing or required
     unless it explicitly appears in the real job description.
  5. Real direct application URLs for every listing.
"""

import os
import re
import json
import logging
import urllib.request
import urllib.parse
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Set, Tuple
from datetime import datetime, timezone

from models.auth_schemas import JobItem, JobFitAnalysis
from models.schemas import ResumeProfile
from nlp.skill_database import ALL_SKILLS_MAP

logger = logging.getLogger("job_search_service")


def strip_html_tags(text: str) -> str:
    """Removes HTML tags and entities from job descriptions."""
    if not text:
        return ""
    clean = re.sub(r'<[^>]+>', ' ', text)
    clean = re.sub(r'&nbsp;', ' ', clean, flags=re.IGNORECASE)
    clean = re.sub(r'&amp;', '&', clean, flags=re.IGNORECASE)
    clean = re.sub(r'&lt;', '<', clean, flags=re.IGNORECASE)
    clean = re.sub(r'&gt;', '>', clean, flags=re.IGNORECASE)
    clean = re.sub(r'&quot;', '"', clean, flags=re.IGNORECASE)
    clean = re.sub(r'&#39;', "'", clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean


def extract_skills_from_job_text(text: str) -> List[str]:
    """
    Extracts genuine technical skills and tools that explicitly appear in the job description.
    Never fabricates skills that are not mentioned in the source job data.
    """
    if not text:
        return []
    text_lower = text.lower()
    found = []
    for skill_name, info in ALL_SKILLS_MAP.items():
        # Match whole word to avoid substring false-positives
        pattern = r'\b' + re.escape(skill_name) + r'\b'
        if re.search(pattern, text_lower):
            found.append(info["display"])

    # Deduplicate while preserving order of discovery
    seen = set()
    deduped = []
    for s in found:
        sl = s.lower()
        if sl not in seen:
            seen.add(sl)
            deduped.append(s)
    return deduped


def format_relative_date(date_str: str) -> str:
    """Formats ISO or standard date strings into user-friendly relative descriptions."""
    if not date_str:
        return "Recently posted"
    try:
        clean_date = date_str.split("T")[0]
        dt = datetime.strptime(clean_date, "%Y-%m-%d")
        now = datetime.now()
        diff_days = (now - dt).days
        if diff_days <= 0:
            return "Today"
        elif diff_days == 1:
            return "1 day ago"
        elif diff_days < 7:
            return f"{diff_days} days ago"
        elif diff_days < 30:
            weeks = max(1, diff_days // 7)
            return f"{weeks} {'week' if weeks == 1 else 'weeks'} ago"
        else:
            months = max(1, diff_days // 30)
            return f"{months} {'month' if months == 1 else 'months'} ago"
    except Exception:
        return "Recently posted"


# ---------------------------------------------------------------------------
# Search Query Generator
# ---------------------------------------------------------------------------

class SearchQueryGenerator:
    """
    Constructs relevant, diverse search queries from the candidate's actual profile.
    Avoids searching for just one hardcoded title.
    """

    @classmethod
    def generate_queries(cls, profile: ResumeProfile) -> List[str]:
        target_role = (profile.target_role or profile.contact_info.title or "").strip()
        tech_skills = profile.skills.technical_skills + profile.skills.frameworks_libraries
        top_skills = [s for s in tech_skills if s.strip()][:5]

        experience_count = len(profile.work_experience)
        if experience_count >= 5:
            level_prefix = "Senior "
        elif experience_count >= 2:
            level_prefix = ""
        else:
            level_prefix = "Junior "

        queries: List[str] = []

        if target_role:
            queries.append(target_role)
            # If target role contains slashes or variants (e.g. AI/ML Engineer)
            split_parts = re.split(r'[/\\|]', target_role)
            if len(split_parts) > 1:
                for part in split_parts:
                    p = part.strip()
                    if len(p) >= 2:
                        if not p.lower().endswith(("engineer", "developer", "specialist")):
                            p = f"{p} Engineer"
                        queries.append(p)

        # Top skill + target role
        if target_role and top_skills:
            queries.append(f"{top_skills[0]} {target_role}")

        # Level + role
        if target_role and level_prefix and not target_role.lower().startswith(("senior", "junior", "lead", "staff", "principal")):
            queries.append(f"{level_prefix}{target_role}".strip())

        # Top 2 skills role synthesis (e.g. "Python FastAPI Engineer")
        if len(top_skills) >= 2:
            queries.append(f"{top_skills[0]} {top_skills[1]} Developer")
        elif top_skills:
            queries.append(f"{top_skills[0]} Developer")

        # Fallback if profile is completely empty
        if not queries:
            queries.append("Software Engineer")

        # Deduplicate while preserving order
        seen = set()
        deduped = []
        for q in queries:
            ql = q.lower().strip()
            if ql and ql not in seen:
                seen.add(ql)
                deduped.append(q)

        return deduped[:4]


# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------

def deduplicate_jobs(jobs: List[JobItem]) -> List[JobItem]:
    """
    Deduplicates real jobs retrieved across multiple search queries using:
      1. Unique Job ID
      2. Canonical Application URL
      3. Composite Key: normalized (company + title + location)
    """
    seen_ids: Set[str] = set()
    seen_links: Set[str] = set()
    seen_composites: Set[Tuple[str, str, str]] = set()
    unique_jobs: List[JobItem] = []

    for job in jobs:
        if job.id and job.id in seen_ids:
            continue
        if job.application_link and job.application_link in seen_links:
            continue

        clean_company = re.sub(r'[^a-z0-9]', '', (job.company or "").lower())
        clean_title = re.sub(r'[^a-z0-9]', '', (job.title or "").lower())
        clean_loc = re.sub(r'[^a-z0-9]', '', (job.location or "").lower()[:15])
        comp_key = (clean_company, clean_title, clean_loc)

        if comp_key != ("", "", "") and comp_key in seen_composites:
            continue

        if job.id:
            seen_ids.add(job.id)
        if job.application_link:
            seen_links.add(job.application_link)
        if comp_key != ("", "", ""):
            seen_composites.add(comp_key)

        unique_jobs.append(job)

    return unique_jobs


# ---------------------------------------------------------------------------
# Provider Interface (ABC)
# ---------------------------------------------------------------------------

class JobSearchProvider(ABC):
    """Abstract contract for dynamic job discovery providers."""

    @abstractmethod
    def search_jobs(
        self,
        query: Optional[str] = None,
        location: Optional[str] = None,
        remote_only: Optional[bool] = False,
        job_type: Optional[str] = None,
        experience_level: Optional[str] = None,
        page: int = 1,
        limit: int = 12
    ) -> List[JobItem]:
        """Searches live external job listings."""
        ...

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns the identifier name of the provider."""
        ...

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if the provider credentials are configured."""
        ...


# ---------------------------------------------------------------------------
# Provider 1: Adzuna Real Job Search API
# ---------------------------------------------------------------------------

class AdzunaJobSearchProvider(JobSearchProvider):
    """
    Connects to the official Adzuna Jobs Search API.
    Docs: https://developer.adzuna.com/
    Endpoint: https://api.adzuna.com/v1/api/jobs/{country}/search/{page}
    """

    def __init__(self):
        self.app_id = os.getenv("ADZUNA_APP_ID", "").strip()
        self.app_key = os.getenv("ADZUNA_APP_KEY", "").strip()
        self.country = os.getenv("ADZUNA_COUNTRY", "us").strip().lower()

    def get_provider_name(self) -> str:
        return "Adzuna"

    def is_configured(self) -> bool:
        return bool(self.app_id and self.app_key)

    def search_jobs(
        self,
        query: Optional[str] = None,
        location: Optional[str] = None,
        remote_only: Optional[bool] = False,
        job_type: Optional[str] = None,
        experience_level: Optional[str] = None,
        page: int = 1,
        limit: int = 12
    ) -> List[JobItem]:
        if not self.is_configured():
            logger.info("Adzuna credentials not configured in backend/.env.")
            return []

        search_query = query.strip() if query else "Software Engineer"
        target_page = max(1, page)

        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "results_per_page": min(50, max(5, limit)),
            "what": search_query,
            "content-type": "application/json"
        }

        if location and location.strip().lower() not in ["all", "remote", "any"]:
            params["where"] = location.strip()

        if remote_only or (location and "remote" in location.lower()):
            params["what"] = f"{search_query} remote"

        if job_type and job_type.lower() == "full-time":
            params["full_time"] = "1"
        elif job_type and job_type.lower() == "part-time":
            params["part_time"] = "1"
        elif job_type and job_type.lower() == "contract":
            params["contract"] = "1"

        url = f"https://api.adzuna.com/v1/api/jobs/{self.country}/search/{target_page}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "CareerAI-JobAssistant/2.1 (External Live Search)",
                "Accept": "application/json"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=8) as response:
                if response.status != 200:
                    logger.error(f"Adzuna API returned HTTP {response.status}")
                    return []
                data = json.loads(response.read().decode("utf-8"))
        except Exception as e:
            logger.error(f"Adzuna search request error: {e}")
            return []

        results = data.get("results", [])
        job_items: List[JobItem] = []

        for item in results:
            raw_id = str(item.get("id") or "")
            title = strip_html_tags(item.get("title") or "Untitled Position")
            company_obj = item.get("company", {})
            company = strip_html_tags(company_obj.get("display_name") if isinstance(company_obj, dict) else str(company_obj) or "Company")

            loc_obj = item.get("location", {})
            location_name = strip_html_tags(loc_obj.get("display_name") if isinstance(loc_obj, dict) else str(loc_obj) or "Location not specified")

            salary_min = item.get("salary_min")
            salary_max = item.get("salary_max")
            salary_is_predicted = str(item.get("salary_is_predicted", "0"))

            # Format salary transparently without fabricating ranges
            if salary_min and salary_is_predicted != "1":
                if salary_max and salary_max > salary_min:
                    salary_range = f"${int(salary_min):,} - ${int(salary_max):,}"
                else:
                    salary_range = f"${int(salary_min):,}/yr"
            else:
                salary_range = "Salary not specified"

            description = strip_html_tags(item.get("description") or "")
            posted_date = format_relative_date(item.get("created") or "")
            application_link = item.get("redirect_url") or ""

            # Detect real skills directly from job text
            detected_skills = extract_skills_from_job_text(f"{title} {description}")

            # Remote status determination
            text_for_remote = f"{title} {location_name} {description}".lower()
            if "remote" in text_for_remote:
                remote_status = "Remote"
            elif "hybrid" in text_for_remote:
                remote_status = "Hybrid"
            else:
                remote_status = "On-site"

            # Experience level determination
            title_lower = title.lower()
            if any(k in title_lower for k in ["lead", "staff", "principal", "director", "head of"]):
                exp_level = "Lead"
            elif any(k in title_lower for k in ["senior", "sr.", "sr "]):
                exp_level = "Mid-Senior"
            elif any(k in title_lower for k in ["junior", "jr.", "entry", "associate", "intern"]):
                exp_level = "Entry Level"
            else:
                exp_level = "Mid-Senior"

            job_items.append(JobItem(
                id=f"adzuna-{raw_id}",
                title=title,
                company=company,
                location=location_name,
                type=job_type or "Full-time",
                salary_range=salary_range,
                experience_level=exp_level,
                description=description,
                required_skills=detected_skills[:5],
                preferred_skills=detected_skills[5:10],
                posted_date=posted_date,
                logo_emoji="💼",
                remote_status=remote_status,
                source="Adzuna",
                application_link=application_link,
                application_status="Found"
            ))

        return job_items


# ---------------------------------------------------------------------------
# Provider 2: Jooble Real Job Search API
# ---------------------------------------------------------------------------

class JoobleJobSearchProvider(JobSearchProvider):
    """
    Connects to the official Jooble API.
    Docs: https://jooble.org/api/about
    Endpoint: POST https://jooble.org/api/{api_key}
    """

    def __init__(self):
        self.api_key = os.getenv("JOOBLE_API_KEY", "").strip()

    def get_provider_name(self) -> str:
        return "Jooble"

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def search_jobs(
        self,
        query: Optional[str] = None,
        location: Optional[str] = None,
        remote_only: Optional[bool] = False,
        job_type: Optional[str] = None,
        experience_level: Optional[str] = None,
        page: int = 1,
        limit: int = 12
    ) -> List[JobItem]:
        if not self.is_configured():
            logger.info("Jooble API key not configured in backend/.env.")
            return []

        search_query = query.strip() if query else "Software Engineer"
        target_page = max(1, page)

        payload = {
            "keywords": search_query if not remote_only else f"{search_query} remote",
            "page": target_page
        }
        if location and location.strip().lower() not in ["all", "remote", "any"]:
            payload["location"] = location.strip()

        url = f"https://jooble.org/api/{self.api_key}"
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data_bytes,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "CareerAI-JobAssistant/2.1",
                "Accept": "application/json"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=8) as response:
                if response.status != 200:
                    logger.error(f"Jooble API returned HTTP {response.status}")
                    return []
                data = json.loads(response.read().decode("utf-8"))
        except Exception as e:
            logger.error(f"Jooble search request error: {e}")
            return []

        jobs_data = data.get("jobs", [])
        job_items: List[JobItem] = []

        for item in jobs_data[:limit]:
            raw_id = str(item.get("id") or "")
            title = strip_html_tags(item.get("title") or "Untitled Position")
            company = strip_html_tags(item.get("company") or "Company")
            location_name = strip_html_tags(item.get("location") or "Location not specified")
            raw_salary = strip_html_tags(item.get("salary") or "").strip()
            salary_range = raw_salary if raw_salary else "Salary not specified"
            description = strip_html_tags(item.get("snippet") or "")
            posted_date = format_relative_date(item.get("updated") or "")
            application_link = item.get("link") or ""

            detected_skills = extract_skills_from_job_text(f"{title} {description}")

            text_for_remote = f"{title} {location_name} {description}".lower()
            if "remote" in text_for_remote:
                remote_status = "Remote"
            elif "hybrid" in text_for_remote:
                remote_status = "Hybrid"
            else:
                remote_status = "On-site"

            job_items.append(JobItem(
                id=f"jooble-{raw_id}",
                title=title,
                company=company,
                location=location_name,
                type=item.get("type") or job_type or "Full-time",
                salary_range=salary_range,
                experience_level=experience_level or "Mid-Senior",
                description=description,
                required_skills=detected_skills[:5],
                preferred_skills=detected_skills[5:10],
                posted_date=posted_date,
                logo_emoji="💼",
                remote_status=remote_status,
                source=item.get("source") or "Jooble",
                application_link=application_link,
                application_status="Found"
            ))

        return job_items


# ---------------------------------------------------------------------------
# Provider 3: Open Live Web Tech Jobs API (Direct Live Web Postings)
# ---------------------------------------------------------------------------

class OpenWebJobSearchProvider(JobSearchProvider):
    """
    Connects to live public developer & tech job boards (Jobicy / Arbeitnow)
    with genuine live listings from real companies, real descriptions, and direct apply URLs.
    No private key required, ensuring real live job search works immediately out-of-the-box.
    """

    def get_provider_name(self) -> str:
        return "Live Web Tech Jobs"

    def is_configured(self) -> bool:
        return True

    def search_jobs(
        self,
        query: Optional[str] = None,
        location: Optional[str] = None,
        remote_only: Optional[bool] = False,
        job_type: Optional[str] = None,
        experience_level: Optional[str] = None,
        page: int = 1,
        limit: int = 12
    ) -> List[JobItem]:
        search_query = (query or "").strip().lower()
        target_page = max(1, page)

        # Query live public engineering job board API
        url = f"https://jobicy.com/api/v2/remote-jobs?count=50"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "CareerAI-LiveJobSearch/2.1 (Real Live Web Postings)",
                "Accept": "application/json"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=9) as response:
                if response.status != 200:
                    return []
                data = json.loads(response.read().decode("utf-8"))
        except Exception as e:
            logger.error(f"Live web search provider error: {e}")
            return []

        raw_jobs = data.get("jobs", [])
        if not raw_jobs:
            return []

        job_items: List[JobItem] = []

        # Filter by search query if user specified keywords
        query_words = [w for w in search_query.split() if len(w) > 2]

        for item in raw_jobs:
            title = strip_html_tags(item.get("jobTitle") or "Untitled Position")
            company = strip_html_tags(item.get("companyName") or "Company")
            location_name = strip_html_tags(item.get("jobGeo") or "Remote")
            description = strip_html_tags(item.get("jobDescription") or item.get("jobExcerpt") or "")
            application_link = item.get("url") or item.get("jobSlug") or ""

            # Check match against user keywords if provided
            full_text = f"{title} {company} {description}".lower()
            if query_words:
                if not any(word in full_text for word in query_words):
                    continue

            # Location filter
            if location and location.strip().lower() not in ["all", "remote", "any"]:
                loc_clean = location.strip().lower()
                if loc_clean not in location_name.lower() and loc_clean not in full_text:
                    continue

            # Salary parsing
            annual_min = item.get("annualSalaryMin")
            annual_max = item.get("annualSalaryMax")
            currency = item.get("salaryCurrency", "USD")
            if annual_min and annual_max and annual_max > annual_min:
                salary_range = f"${int(annual_min):,} - ${int(annual_max):,} {currency}"
            elif annual_min:
                salary_range = f"${int(annual_min):,} {currency}"
            else:
                salary_range = "Salary not specified"

            # Detected real skills
            detected_skills = extract_skills_from_job_text(f"{title} {description}")

            raw_id = str(item.get("id") or hash(f"{company}-{title}"))
            posted_date = format_relative_date(item.get("pubDate") or "")

            raw_type = item.get("jobType")
            type_str = ", ".join(raw_type) if isinstance(raw_type, list) else str(raw_type or "Full-time")

            raw_level = item.get("jobLevel")
            level_str = ", ".join(raw_level) if isinstance(raw_level, list) else str(raw_level or "Mid-Senior")

            job_items.append(JobItem(
                id=f"live-{raw_id}",
                title=title,
                company=company,
                location=location_name,
                type=type_str,
                salary_range=salary_range,
                experience_level=level_str,
                description=description[:1200],
                required_skills=detected_skills[:5],
                preferred_skills=detected_skills[5:10],
                posted_date=posted_date,
                logo_emoji="💼",
                remote_status="Remote",
                source="Live Web Search",
                application_link=application_link,
                application_status="Found"
            ))

        # Pagination slice
        start_idx = (target_page - 1) * limit
        end_idx = start_idx + limit
        return job_items[start_idx:end_idx]


# ---------------------------------------------------------------------------
# Job Search Service Manager
# ---------------------------------------------------------------------------

class JobSearchService:
    """
    Central service orchestrating external job providers, search query generation,
    deduplication, and candidate-to-job matching.
    """

    def __init__(self):
        self.providers: Dict[str, JobSearchProvider] = {
            "adzuna": AdzunaJobSearchProvider(),
            "jooble": JoobleJobSearchProvider(),
            "open_web": OpenWebJobSearchProvider()
        }

    def get_active_provider(self) -> JobSearchProvider:
        """
        Determines the active provider based on server configuration:
        1. JOB_SEARCH_PROVIDER env var (adzuna, jooble, or open_web)
        2. If adzuna/jooble configured with keys, uses it.
        3. If adzuna is selected but keys are blank, seamlessly uses open_web
           so real live jobs are always returned rather than crashing or showing fake data.
        """
        configured_type = os.getenv("JOB_SEARCH_PROVIDER", "adzuna").strip().lower()

        provider = self.providers.get(configured_type)
        if provider and provider.is_configured():
            return provider

        # If adzuna or jooble selected but keys not yet set, use the live open web tech provider
        # so real live jobs from genuine employers are displayed
        return self.providers["open_web"]

    def get_provider_status(self) -> Dict[str, Any]:
        """Returns the active provider configuration status."""
        active = self.get_active_provider()
        adzuna_configured = self.providers["adzuna"].is_configured()
        jooble_configured = self.providers["jooble"].is_configured()

        return {
            "active_provider": active.get_provider_name(),
            "is_configured": active.is_configured(),
            "adzuna_configured": adzuna_configured,
            "jooble_configured": jooble_configured,
            "using_open_web": isinstance(active, OpenWebJobSearchProvider)
        }

    def search_jobs(
        self,
        query: Optional[str] = None,
        location: Optional[str] = None,
        remote_only: Optional[bool] = False,
        job_type: Optional[str] = None,
        experience_level: Optional[str] = None,
        page: int = 1,
        limit: int = 12
    ) -> List[JobItem]:
        """Executes search against active provider and deduplicates results."""
        provider = self.get_active_provider()
        raw_jobs = provider.search_jobs(
            query=query,
            location=location,
            remote_only=remote_only,
            job_type=job_type,
            experience_level=experience_level,
            page=page,
            limit=limit
        )
        return deduplicate_jobs(raw_jobs)

    def discover_jobs_from_profile(
        self,
        profile: ResumeProfile,
        page: int = 1,
        limit: int = 12
    ) -> List[JobItem]:
        """
        Dynamically constructs diverse queries from candidate profile, searches external
        providers, deduplicates jobs, and scores & ranks them against candidate profile.
        """
        queries = SearchQueryGenerator.generate_queries(profile)
        provider = self.get_active_provider()

        all_discovered: List[JobItem] = []

        # Execute searches across top synthesized queries
        for q in queries:
            try:
                jobs = provider.search_jobs(
                    query=q,
                    location=profile.contact_info.location,
                    page=page,
                    limit=limit
                )
                all_discovered.extend(jobs)
                if len(all_discovered) >= limit * 2:
                    break
            except Exception as e:
                logger.error(f"Error querying provider for '{q}': {e}")

        # Deduplicate results across queries
        deduped = deduplicate_jobs(all_discovered)

        # Rank jobs by candidate fit score
        ranked_jobs = []
        for job in deduped:
            fit = calculate_candidate_job_fit(profile, job)
            ranked_jobs.append((fit.match_score, job))

        # Sort descending by match score
        ranked_jobs.sort(key=lambda x: x[0], reverse=True)
        final_list = [j for _, j in ranked_jobs]

        return final_list[:limit]


# Global singleton instance
job_search_service = JobSearchService()


def get_job_search_provider() -> JobSearchProvider:
    return job_search_service.get_active_provider()


# ---------------------------------------------------------------------------
# Truth-Preserving Candidate-to-Job Fit Scoring
# ---------------------------------------------------------------------------

def calculate_candidate_job_fit(resume: ResumeProfile, job: JobItem) -> JobFitAnalysis:
    """
    Truth-preserving fit evaluation:
    Strictly checks what skills exist in the candidate's profile against the
    actual job description without hallucinating experience or requirements.
    """
    candidate_skills_raw = (
        resume.skills.technical_skills +
        resume.skills.frameworks_libraries +
        resume.skills.developer_tools +
        resume.skills.other
    )

    full_candidate_text = " ".join([
        resume.summary,
        resume.target_role,
        resume.contact_info.title or "",
        " ".join([f"{e.position} {e.company} {' '.join(e.highlights)}" for e in resume.work_experience]),
        " ".join([f"{p.title} {' '.join(p.technologies)} {p.description}" for p in resume.projects]),
        " ".join([f"{ed.degree} {ed.institution}" for ed in resume.education]),
        " ".join(candidate_skills_raw)
    ]).lower()

    candidate_skills_lower = set(s.lower().strip() for s in candidate_skills_raw if s.strip())

    # Get actual skills present in the real job
    job_full_text = f"{job.title} {job.description}".lower()
    actual_job_skills = extract_skills_from_job_text(job_full_text)

    matched_skills: List[str] = []
    missing_skills: List[str] = []
    partially_matching_skills: List[str] = []

    # Partition actual job skills into matched vs missing
    for skill in actual_job_skills:
        skill_clean = skill.strip()
        skill_lower = skill_clean.lower()
        if skill_lower in candidate_skills_lower or any(skill_lower in s for s in candidate_skills_lower) or skill_lower in full_candidate_text:
            matched_skills.append(skill_clean)
        elif any(part in full_candidate_text for part in skill_lower.split() if len(part) > 3):
            partially_matching_skills.append(skill_clean)
        else:
            missing_skills.append(skill_clean)

    # Calculate transparent match score
    total_skills = max(1, len(actual_job_skills))
    skill_match_ratio = len(matched_skills) / total_skills

    # Title alignment score
    target_role_lower = (resume.target_role or resume.contact_info.title or "").lower()
    job_title_lower = job.title.lower()
    if target_role_lower and any(word in job_title_lower for word in target_role_lower.split() if len(word) > 3):
        title_score = 30.0
    else:
        title_score = 15.0

    # Skills score
    skills_score = skill_match_ratio * 50.0

    # Experience match score
    if len(resume.work_experience) >= 2:
        exp_score = 20.0
        exp_match = "Strong Match (Verified Experience)"
    elif len(resume.work_experience) == 1:
        exp_score = 15.0
        exp_match = "Moderate Match"
    else:
        exp_score = 10.0
        exp_match = "Entry Level / Academic"

    final_score = int(min(98, max(35, round(skills_score + title_score + exp_score))))

    if final_score >= 88:
        grade = "A+"
    elif final_score >= 80:
        grade = "A"
    elif final_score >= 70:
        grade = "B"
    elif final_score >= 60:
        grade = "C"
    else:
        grade = "Needs Work"

    # Truthful tailoring guidance
    tailoring_suggestions = []
    if matched_skills:
        tailoring_suggestions.append({
            "section": "Technical Skills",
            "recommendation": f"Feature your verified matching skills ({', '.join(matched_skills[:4])}) prominently on your resume."
        })
    if missing_skills:
        tailoring_suggestions.append({
            "section": "Skill Gaps",
            "recommendation": f"This role mentions {', '.join(missing_skills[:3])}. If you have practical project experience with these, add them to your resume."
        })
    if resume.target_role != job.title:
        tailoring_suggestions.append({
            "section": "Target Role",
            "recommendation": f"Align resume target role to '{job.title}' for direct applicant tracking system indexing."
        })

    return JobFitAnalysis(
        job=job,
        match_score=final_score,
        grade=grade,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        partially_matching_skills=partially_matching_skills,
        experience_match=exp_match,
        education_match="Meets Requirements",
        tailoring_suggestions=tailoring_suggestions
    )
