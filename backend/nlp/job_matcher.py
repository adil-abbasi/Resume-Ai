import re
from typing import List, Dict, Set, Tuple
from models.schemas import (
    ResumeProfile, JobDescriptionData, JobMatchResult
)
from nlp.skill_database import ALL_SKILLS_MAP, SKILL_CATEGORIES


# Tech cluster similarities for partial matches
RELATED_SKILLS_CLUSTER = {
    "react": ["next.js", "vue", "angular", "svelte", "typescript", "javascript"],
    "vue": ["react", "nuxt", "angular", "javascript", "typescript"],
    "angular": ["react", "vue", "typescript", "rxjs"],
    "python": ["django", "fastapi", "flask", "pytorch", "pandas", "numpy"],
    "django": ["fastapi", "flask", "python", "ruby on rails", "express"],
    "fastapi": ["django", "flask", "python", "express", "nest.js"],
    "node.js": ["express", "nest.js", "typescript", "javascript"],
    "aws": ["gcp", "azure", "docker", "kubernetes", "cloudformation", "terraform"],
    "gcp": ["aws", "azure", "kubernetes", "terraform", "bigquery"],
    "azure": ["aws", "gcp", "docker", "kubernetes", ".net core"],
    "postgresql": ["mysql", "sqlite", "mongodb", "supabase", "sql"],
    "mongodb": ["postgresql", "mysql", "redis", "dynamodb", "nosql"],
    "docker": ["kubernetes", "ci/cd", "helm", "terraform"],
    "kubernetes": ["docker", "helm", "argo cd", "terraform", "aws"],
    "pytorch": ["tensorflow", "keras", "scikit-learn", "deep learning"],
    "tensorflow": ["pytorch", "keras", "scikit-learn", "deep learning"],
}


class JobMatcher:
    """
    Extracts requirements from job postings and scores candidate compatibility.
    Provides truth-preserving tailoring recommendations.
    """

    @classmethod
    def extract_job_requirements(cls, job_text: str) -> JobDescriptionData:
        lines = [line.strip() for line in job_text.splitlines() if line.strip()]
        job_lower = job_text.lower()

        # Extract Job Title & Company
        job_title = ""
        company = ""
        for line in lines[:15]:
            clean_l = re.sub(r'^(the\s+role|position|job\s+title|role)[\s:]*', '', line, flags=re.IGNORECASE).strip()
            if len(clean_l.split()) <= 8 and re.search(r'\b(engineer|developer|designer|manager|scientist|architect|lead|specialist|intern|analyst)\b', clean_l, re.IGNORECASE):
                job_title = clean_l
                break
        if not job_title and lines:
            job_title = lines[0][:50]

        for line in lines[:8]:
            if any(term in line.lower() for term in ["about ", "at ", "inc", "ltd", "corp", "technologies", "company", "systems", "stripe", "netflix", "google"]):
                company = re.sub(r'^about\s+', '', line, flags=re.IGNORECASE).rstrip(':')
                break

        # Extract Skills
        required_skills: Set[str] = set()
        preferred_skills: Set[str] = set()
        tools: Set[str] = set()

        for skill_kw, meta in ALL_SKILLS_MAP.items():
            pattern = r'(?:\b|(?<=\s))' + re.escape(skill_kw) + r'(?:\b|(?=\s|,|\.|\/|\)))'
            if re.search(pattern, job_lower):
                disp = meta["display"]
                cat = meta["category"]
                
                # Check if it falls under preferred vs required section
                if any(pref in job_lower for pref in ["nice to have", "plus", "preferred", "bonus", "optional"]):
                    # Simple heuristic check based on location in text
                    preferred_skills.add(disp)
                else:
                    required_skills.add(disp)

                if cat in ["Developer Tools & Methods", "Databases & Caching", "Cloud & DevOps"]:
                    tools.add(disp)

        # Extract Experience Years
        exp_match = re.search(r'(\d+)\+?\s*(?:-\s*\d+)?\s*(?:years|yrs)\s+(?:of\s+)?experience', job_lower)
        exp_years = f"{exp_match.group(1)}+ years" if exp_match else None

        # Extract Education Requirements
        education_reqs = []
        if "bachelor" in job_lower or "b.s" in job_lower or "btech" in job_lower:
            education_reqs.append("Bachelor's degree in CS or related field")
        if "master" in job_lower or "m.s" in job_lower:
            education_reqs.append("Master's degree preferred")
        if "phd" in job_lower or "doctorate" in job_lower:
            education_reqs.append("Ph.D. in related technical field")

        # Extract Responsibilities
        responsibilities = []
        for line in lines:
            if line.startswith(("•", "-", "*")) and len(line.split()) >= 6:
                clean_line = re.sub(r'^[•\-\*\s]+', '', line).strip()
                if clean_line:
                    responsibilities.append(clean_line)

        return JobDescriptionData(
            raw_text=job_text,
            job_title=job_title or "Target Role",
            company=company or "Hiring Team",
            extracted_required_skills=sorted(list(required_skills)),
            extracted_preferred_skills=sorted(list(preferred_skills - required_skills)),
            extracted_experience_years=exp_years,
            extracted_education=education_reqs,
            extracted_tools=sorted(list(tools)),
            extracted_responsibilities=responsibilities[:8]
        )

    @classmethod
    def match_resume_to_job(cls, profile: ResumeProfile, job_data: JobDescriptionData) -> JobMatchResult:
        # Collect all candidate skills into lowercase set
        candidate_skills: Set[str] = set()
        for s in profile.skills.technical_skills + profile.skills.frameworks_libraries + profile.skills.developer_tools + profile.skills.soft_skills + profile.skills.other:
            candidate_skills.add(s.lower().strip())

        # Also scan experience and project text for implicit mentions of skills
        candidate_corpus = " ".join([
            profile.summary,
            " ".join([h for exp in profile.work_experience for h in exp.highlights]),
            " ".join([h for proj in profile.projects for h in proj.highlights]),
            " ".join(profile.achievements)
        ]).lower()

        for skill_kw in ALL_SKILLS_MAP.keys():
            pattern = r'(?:\b|(?<=\s))' + re.escape(skill_kw) + r'(?:\b|(?=\s|,|\.|\/|\)))'
            if re.search(pattern, candidate_corpus):
                candidate_skills.add(skill_kw)

        # Categorize matches
        job_req_skills = [s.lower() for s in job_data.extracted_required_skills]
        if not job_req_skills:
            # Fallback if no skills explicitly marked required
            job_req_skills = [s.lower() for s in job_data.extracted_preferred_skills]

        matched_skills: List[str] = []
        missing_skills: List[str] = []
        partial_skills: List[str] = []

        for req_skill in job_req_skills:
            req_disp = ALL_SKILLS_MAP.get(req_skill, {}).get("display", req_skill.title())
            if req_skill in candidate_skills:
                matched_skills.append(req_disp)
            else:
                # Check for cluster relatedness
                related_group = RELATED_SKILLS_CLUSTER.get(req_skill, [])
                has_related = any(r in candidate_skills for r in related_group)
                if has_related:
                    partial_skills.append(f"{req_disp} (Experience in related: {', '.join([ALL_SKILLS_MAP.get(r, {}).get('display', r) for r in related_group if r in candidate_skills][:2])})")
                else:
                    missing_skills.append(req_disp)

        # Calculate Skill Match Score
        total_reqs = max(1, len(job_req_skills))
        skill_score = (len(matched_skills) * 1.0 + len(partial_skills) * 0.5) / total_reqs * 100.0
        skill_score = min(100.0, skill_score)

        # Project & Experience Match
        project_count = len(profile.projects)
        exp_count = len(profile.work_experience)
        
        # Calculate relevance of projects to target role keywords
        project_relevance_pts = 60
        target_words = set(re.findall(r'\w+', job_data.job_title.lower()))
        for proj in profile.projects:
            proj_text = f"{proj.title} {proj.description} {' '.join(proj.highlights)}".lower()
            if any(w in proj_text for w in target_words if len(w) > 3):
                project_relevance_pts += 15
        project_relevance_score = min(100, project_relevance_pts)

        # Experience Match assessment
        if exp_count >= 3:
            experience_match = "Strong Match"
        elif exp_count >= 1 or project_count >= 2:
            experience_match = "Moderate Match"
        else:
            experience_match = "Early Career / Requires Verification"

        # Education Match
        education_match = "Meets Requirements" if profile.education else "Unspecified"

        # Overall Job Match Score
        overall_match = int(round(skill_score * 0.60 + project_relevance_score * 0.25 + (85 if experience_match == "Strong Match" else 70) * 0.15))
        overall_match = max(15, min(99, overall_match))

        # Grade
        if overall_match >= 85:
            grade = "Excellent Match"
        elif overall_match >= 70:
            grade = "Good Match"
        elif overall_match >= 50:
            grade = "Partial Match"
        else:
            grade = "Low Match"

        # Explanation
        match_explanation = (
            f"Compatibility score of {overall_match}% for {job_data.job_title} at {job_data.company}. "
            f"Candidate matches {len(matched_skills)} of {total_reqs} primary skills with {len(partial_skills)} transferable skill overlaps. "
            f"Project alignment rated at {project_relevance_score}%."
        )

        # Recommendations
        recommendations = []
        if missing_skills:
            recommendations.append(
                f"Highlight any familiarity or adjacent coursework in missing requirements: {', '.join(missing_skills[:4])}."
            )
        if partial_skills:
            recommendations.append(
                "Emphasize transferable framework proficiency in your summary to bridge partial tech stack overlaps."
            )
        recommendations.append(
            f"Customize your summary headline to explicitly reflect '{job_data.job_title}' to improve ATS keyword ranking."
        )

        # Tailoring Suggestions (Truth-preserving)
        tailoring_suggestions = []
        if matched_skills:
            tailoring_suggestions.append({
                "section": "Professional Summary",
                "recommendation": f"Mention top matched skills ({', '.join(matched_skills[:3])}) in the first two sentences of your summary."
            })
        if profile.projects:
            tailoring_suggestions.append({
                "section": "Projects",
                "recommendation": f"Prioritize projects that demonstrate {job_data.job_title} skills at the top of your resume."
            })
        if missing_skills:
            tailoring_suggestions.append({
                "section": "Skills & Keyword Optimization",
                "recommendation": f"If you have academic, project, or self-taught experience with {', '.join(missing_skills[:2])}, ensure it is listed."
            })

        return JobMatchResult(
            job_title=job_data.job_title,
            company=job_data.company,
            match_score=overall_match,
            grade=grade,
            matched_skills=matched_skills,
            missing_critical_skills=missing_skills,
            partially_matching_skills=partial_skills,
            experience_match=experience_match,
            education_match=education_match,
            project_relevance_score=project_relevance_score,
            match_explanation=match_explanation,
            recommendations=recommendations,
            tailoring_suggestions=tailoring_suggestions
        )
