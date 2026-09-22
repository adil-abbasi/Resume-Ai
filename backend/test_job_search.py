"""
Test Suite for Real Dynamic Job Search System
=============================================
Tests:
  1. SearchQueryGenerator query synthesis from ResumeProfile.
  2. Job deduplication (ID, URL, composite key).
  3. Truth-preserving skill matching & gap calculation from real job text.
  4. Real dynamic job discovery and normalization.
  5. Absence of fake fallback when results are empty.
"""

import sys
from models.schemas import ResumeProfile, ContactInfo, SkillsGroup, ExperienceItem, ProjectItem, EducationItem
from models.auth_schemas import JobItem
from services.job_search_service import (
    job_search_service,
    SearchQueryGenerator,
    deduplicate_jobs,
    calculate_candidate_job_fit,
    extract_skills_from_job_text
)


def create_test_profile() -> ResumeProfile:
    return ResumeProfile(
        id="test-alex-chen",
        target_role="AI / ML Engineer",
        summary="Experienced software engineer specializing in deep learning, natural language processing, and scalable distributed systems.",
        contact_info=ContactInfo(
            full_name="Alex Chen",
            email="alex.chen@example.com",
            phone="+1 (555) 234-5678",
            location="San Francisco, CA",
            title="Senior Machine Learning Specialist"
        ),
        skills=SkillsGroup(
            technical_skills=["Python", "PyTorch", "TensorFlow", "FastAPI", "PostgreSQL"],
            frameworks_libraries=["Docker", "Kubernetes", "HuggingFace", "LangChain"],
            developer_tools=["Git", "Linux", "CI/CD"],
            other=["REST APIs", "Microservices"]
        ),
        work_experience=[
            ExperienceItem(
                company="Nexus AI Corp",
                position="Senior Machine Learning Engineer",
                start_date="2021",
                end_date="Present",
                highlights=[
                    "Architected high-throughput transformer inference service reducing latency by 42%.",
                    "Deployed containerized FastAPI endpoints serving 20M+ daily predictions."
                ]
            ),
            ExperienceItem(
                company="DataStream Technologies",
                position="AI Software Developer",
                start_date="2018",
                end_date="2021",
                highlights=[
                    "Trained deep learning classification models with PyTorch on AWS GPU clusters."
                ]
            )
        ],
        projects=[
            ProjectItem(
                title="Distributed Vector Search Engine",
                technologies=["Python", "FastAPI", "Docker", "PyTorch"],
                description="Built an approximate nearest neighbor search service with sub-10ms response times."
            )
        ],
        education=[
            EducationItem(
                institution="UC Berkeley",
                degree="B.S. in Computer Science",
                graduation_year="2018"
            )
        ]
    )


def test_search_query_generator():
    print("=== 1. Testing SearchQueryGenerator ===")
    profile = create_test_profile()
    queries = SearchQueryGenerator.generate_queries(profile)

    print(f"Generated queries from profile: {queries}")
    assert len(queries) >= 2, "Expected multiple search queries"
    assert any("ai" in q.lower() or "machine learning" in q.lower() or "python" in q.lower() for q in queries), \
        "Generated queries should reflect candidate's target role and top skills"
    print("[PASS] SearchQueryGenerator passed successfully!\n")


def test_deduplication():
    print("=== 2. Testing Job Deduplication ===")
    j1 = JobItem(
        id="live-101",
        title="AI Engineer",
        company="Anthropic",
        location="San Francisco, CA",
        type="Full-time",
        salary_range="$180,000 - $240,000",
        experience_level="Senior",
        description="Build frontier AI safety models.",
        required_skills=["Python", "PyTorch"],
        preferred_skills=["Docker"],
        posted_date="Today",
        application_link="https://boards.greenhouse.io/anthropic/jobs/101"
    )
    # Duplicate by ID
    j2 = JobItem(
        id="live-101",
        title="AI Engineer",
        company="Anthropic",
        location="San Francisco, CA",
        type="Full-time",
        salary_range="Salary not specified",
        experience_level="Senior",
        description="Duplicate ID job",
        required_skills=[],
        preferred_skills=[],
        posted_date="Today",
        application_link="https://different-url.com"
    )
    # Duplicate by Link
    j3 = JobItem(
        id="live-102",
        title="Staff AI Engineer",
        company="Anthropic Inc",
        location="San Francisco, CA",
        type="Full-time",
        salary_range="Salary not specified",
        experience_level="Senior",
        description="Duplicate Link job",
        required_skills=[],
        preferred_skills=[],
        posted_date="Today",
        application_link="https://boards.greenhouse.io/anthropic/jobs/101"
    )
    # Unique Job
    j4 = JobItem(
        id="live-103",
        title="Backend Systems Developer",
        company="Stripe",
        location="Remote",
        type="Full-time",
        salary_range="$160,000 - $200,000",
        experience_level="Mid-Senior",
        description="Scale payment infrastructure.",
        required_skills=["Go", "PostgreSQL"],
        preferred_skills=["Docker"],
        posted_date="2 days ago",
        application_link="https://stripe.com/jobs/103"
    )

    deduped = deduplicate_jobs([j1, j2, j3, j4])
    print(f"Original: 4 jobs -> Deduplicated: {len(deduped)} jobs")
    assert len(deduped) == 2, f"Expected 2 unique jobs, got {len(deduped)}"
    assert deduped[0].id == "live-101"
    assert deduped[1].id == "live-103"
    print("[PASS] Deduplication passed successfully!\n")


def test_truth_preserving_matching():
    print("=== 3. Testing Truth-Preserving Skill Matching ===")
    profile = create_test_profile()

    real_job = JobItem(
        id="live-201",
        title="Senior Machine Learning & Python Engineer",
        company="Scale AI",
        location="San Francisco, CA",
        type="Full-time",
        salary_range="$190,000 - $250,000",
        experience_level="Mid-Senior",
        description="We are seeking an ML engineer proficient in Python, PyTorch, and Docker. Experience with Rust, Terraform, and AWS is a plus.",
        required_skills=["Python", "PyTorch", "Docker"],
        preferred_skills=["Rust", "Terraform", "AWS"],
        posted_date="1 day ago",
        application_link="https://scale.com/careers/201"
    )

    fit = calculate_candidate_job_fit(profile, real_job)

    print(f"Match score: {fit.match_score}% (Grade: {fit.grade})")
    print(f"Matched skills: {fit.matched_skills}")
    print(f"Missing skills (gaps): {fit.missing_skills}")

    matched_lower = [s.lower() for s in fit.matched_skills]
    assert "python" in matched_lower
    assert "pytorch" in matched_lower
    assert "docker" in matched_lower

    # Alex Chen does NOT have Rust or Terraform in profile skills
    assert any(gap in ["Rust", "Terraform", "Aws", "AWS"] for gap in fit.missing_skills)

    assert fit.match_score >= 70, f"Expected strong match score, got {fit.match_score}"
    print("[PASS] Truth-preserving matching passed successfully!\n")


def test_live_search_and_no_fake_fallback():
    print("=== 4. Testing Live Job Search Execution & Zero Fake Fallback ===")
    # 1. Search for live jobs
    live_jobs = job_search_service.search_jobs(query="Python Engineer", limit=6)
    print(f"Live jobs returned: {len(live_jobs)}")
    if live_jobs:
        first = live_jobs[0]
        print(f"Sample live job: '{first.title}' at '{first.company}' ({first.location})")
        print(f"Direct link: {first.application_link}")
        print(f"Salary: {first.salary_range}")
        print(f"Source: {first.source}")
        assert first.title, "Live job must have a real title"
        assert first.company, "Live job must have a company"
        assert first.application_link, "Live job must have an application URL"

    # 2. Search for nonsense string - verify zero fake fallback
    empty_search = job_search_service.search_jobs(query="xyz999nonexistentqueryabcdef123", limit=6)
    print(f"Nonsense query returned {len(empty_search)} jobs (expected 0).")
    assert len(empty_search) == 0, "Expected empty list for non-existent query, not hardcoded jobs!"
    print("[PASS] Live job search & Zero Fake Fallback passed successfully!\n")


def run_all_tests():
    test_search_query_generator()
    test_deduplication()
    test_truth_preserving_matching()
    test_live_search_and_no_fake_fallback()
    print("==================================================")
    print("ALL JOB SEARCH SYSTEM TESTS PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    run_all_tests()
