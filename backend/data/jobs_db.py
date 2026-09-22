"""
Dynamic Job Search & Candidate Fit Bridge
=========================================
Connects to JobSearchService for dynamic web discovery and truth-preserving matching.
Removes static/dummy job listings and dynamically discovers opportunities from web search
or the candidate's active profile.
"""

from typing import List, Optional
from models.auth_schemas import JobItem, JobFitAnalysis
from models.schemas import ResumeProfile
from services.job_search_service import (
    job_search_service,
    get_job_search_provider,
    calculate_candidate_job_fit
)


def search_jobs(
    query: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    remote_only: Optional[bool] = False,
    page: int = 1,
    limit: int = 12
) -> List[JobItem]:
    """Dynamically discovers live jobs via the active JobSearchProvider."""
    return job_search_service.search_jobs(
        query=query,
        location=location,
        remote_only=remote_only,
        job_type=job_type,
        experience_level=experience_level,
        page=page,
        limit=limit
    )


def discover_jobs_from_profile(profile: ResumeProfile, page: int = 1, limit: int = 12) -> List[JobItem]:
    """Dynamically discovers live jobs matching the candidate's active profile."""
    return job_search_service.discover_jobs_from_profile(profile=profile, page=page, limit=limit)


def get_dynamic_catalog(query: str = "Software Engineer", page: int = 1, limit: int = 12) -> List[JobItem]:
    """Discovers fresh jobs dynamically from web search provider."""
    return job_search_service.search_jobs(query=query, location="Remote", page=page, limit=limit)


class _DynamicJobsCatalog(list):
    """
    Dynamic list proxy ensuring zero static/dummy jobs exist.
    All calls to SAMPLE_JOBS_CATALOG dynamically discover from web search.
    """
    def __iter__(self):
        return iter(get_dynamic_catalog())
    
    def __getitem__(self, index):
        catalog = get_dynamic_catalog()
        return catalog[index] if index < len(catalog) else (catalog[0] if catalog else None)
    
    def __len__(self):
        return len(get_dynamic_catalog())


SAMPLE_JOBS_CATALOG = _DynamicJobsCatalog()
