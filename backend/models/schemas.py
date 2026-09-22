from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ContactInfo(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""
    title: str = ""


class EducationItem(BaseModel):
    institution: str = ""
    degree: str = ""
    field_of_study: str = ""
    start_date: str = ""
    end_date: str = ""
    gpa: str = ""
    location: str = ""
    highlights: List[str] = Field(default_factory=list)


class ExperienceItem(BaseModel):
    company: str = ""
    position: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    current: bool = False
    highlights: List[str] = Field(default_factory=list)


class ProjectItem(BaseModel):
    title: str = ""
    description: str = ""
    technologies: List[str] = Field(default_factory=list)
    link: str = ""
    highlights: List[str] = Field(default_factory=list)


class CertificationItem(BaseModel):
    name: str = ""
    issuer: str = ""
    issue_date: str = ""
    expiry_date: str = ""
    credential_id: str = ""
    credential_url: str = ""


class SkillsGroup(BaseModel):
    technical_skills: List[str] = Field(default_factory=list)
    frameworks_libraries: List[str] = Field(default_factory=list)
    developer_tools: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)  # spoken languages (e.g. English, Urdu)
    other: List[str] = Field(default_factory=list)


class ResumeProfile(BaseModel):
    id: str = "default-resume"
    title: str = "My Professional Resume"
    target_role: str = ""
    contact_info: ContactInfo = Field(default_factory=ContactInfo)
    summary: str = ""
    skills: SkillsGroup = Field(default_factory=SkillsGroup)
    work_experience: List[ExperienceItem] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[CertificationItem] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    extracurriculars: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)  # spoken languages (e.g. ["English (Fluent)", "Urdu (Native)"])
    career_interests: str = ""  # career goals / areas of interest
    raw_resume_text: str = ""  # Source of truth original raw text of uploaded CV


class ExtractionValidationResult(BaseModel):
    is_complete: bool = True
    is_valid: bool = True
    coverage_score: int = 100
    missing_sections: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    detected_sections: List[str] = Field(default_factory=list)
    stats: Dict[str, Any] = Field(default_factory=dict)


class TemplateCustomization(BaseModel):
    template_id: str = "modern"  # modern, minimal, classic, professional, executive
    font_family: str = "Inter"
    font_size: str = "medium"  # small, medium, large
    heading_size: str = "medium"
    accent_color: str = "#2563EB"
    secondary_color: str = "#1E293B"
    spacing: str = "normal"  # compact, normal, spacious
    margins: str = "normal"  # compact, normal, spacious
    column_layout: str = "two_column"  # single_column, two_column
    section_order: List[str] = Field(
        default_factory=lambda: [
            "summary",
            "experience",
            "projects",
            "skills",
            "education",
            "certifications",
            "achievements",
        ]
    )
    section_visibility: Dict[str, bool] = Field(
        default_factory=lambda: {
            "summary": True,
            "experience": True,
            "projects": True,
            "skills": True,
            "education": True,
            "certifications": True,
            "achievements": True,
            "extracurriculars": True,
        }
    )


# --- Analysis Models ---

class ScoreBreakdown(BaseModel):
    completeness_score: int = 0
    impact_score: int = 0
    action_verb_score: int = 0
    formatting_score: int = 0
    skills_depth_score: int = 0
    overall_score: int = 0


class WeakBulletIssue(BaseModel):
    original_text: str
    issue_type: str  # "vague_verb", "missing_metrics", "passive_voice", "too_short", "project_title"
    reason: str           # short plain-English explanation of the weakness
    suggested_fix: str    # factual improved version — NO invented metrics
    weakness_label: str = ""         # e.g. "Weak action verb", "Missing impact"
    metric_opportunity: bool = False # True if a real metric could improve this bullet
    metric_prompt: str = ""          # e.g. "How many users / APIs / modules did this support?"
    polished_text: str = ""          # deterministic polish (action verb + clarity, no numbers)
    is_project_title: bool = False   # True when the bullet is a project heading, not an achievement


class TemplateRecommendation(BaseModel):
    template_id: str
    name: str
    category: str
    is_pro: bool = False
    thumbnail_color: str = "#2563EB"
    secondary_color: str = "#1E293B"
    font_family: str = "Inter"
    layout_type: str = "two_column"
    match_score: int = 95
    match_reason: str
    estimated_score_boost: int = 15
    preview_tag: str = "Best for Tech & ATS"


class ReadabilityMetrics(BaseModel):
    flesch_reading_ease: float = 65.0
    reading_level: str = "Professional / Standard"
    avg_sentence_length: float = 16.5
    estimated_read_time_seconds: int = 45
    formatting_density: str = "Optimal"  # "Too Dense", "Optimal", "Too Sparse"
    bullet_length_grade: str = "Good"


class ATSAnalysisResult(BaseModel):
    overall_score: int
    grade: str  # "A+", "A", "B", "C", "Needs Work"
    score_breakdown: ScoreBreakdown
    total_words: int
    bullet_count: int
    quantified_bullet_count: int
    action_verb_count: int
    weak_phrases_count: int
    missing_sections: List[str]
    identified_skills: Dict[str, List[str]]
    weak_bullets: List[WeakBulletIssue]
    actionable_suggestions: List[Dict[str, Any]]
    score_explanation: str
    recommended_templates: List[TemplateRecommendation] = Field(default_factory=list)
    readability_metrics: ReadabilityMetrics = Field(default_factory=ReadabilityMetrics)



# --- Job Matching Models ---

class JobDescriptionData(BaseModel):
    raw_text: str
    job_title: str = ""
    company: str = ""
    extracted_required_skills: List[str] = Field(default_factory=list)
    extracted_preferred_skills: List[str] = Field(default_factory=list)
    extracted_experience_years: Optional[str] = None
    extracted_education: List[str] = Field(default_factory=list)
    extracted_tools: List[str] = Field(default_factory=list)
    extracted_responsibilities: List[str] = Field(default_factory=list)


class JobMatchResult(BaseModel):
    job_title: str
    company: str
    match_score: int
    grade: str
    matched_skills: List[str]
    missing_critical_skills: List[str]
    partially_matching_skills: List[str]
    experience_match: str  # "Strong Match", "Moderate Match", "Requires Verification"
    education_match: str  # "Meets Requirements", "Partial Match", "Unspecified"
    project_relevance_score: int
    match_explanation: str
    recommendations: List[str]
    tailoring_suggestions: List[Dict[str, str]]


# --- AI Interview Models ---

class InterviewMessage(BaseModel):
    sender: str  # "ai" or "user"
    text: str
    timestamp: Optional[str] = None


class InterviewSessionState(BaseModel):
    current_step: str  # "personal", "education", "experience", "projects", "skills", "certifications", "completed"
    question_index: int = 0
    collected_profile: ResumeProfile = Field(default_factory=ResumeProfile)
    messages: List[InterviewMessage] = Field(default_factory=list)
    is_complete: bool = False
    last_updated_section: Optional[str] = None


# --- Rewrite Request Models ---

class RewriteBulletRequest(BaseModel):
    bullet_text: str
    mode: str = "polish"  # "polish", "impact", "concise", "professional", "technical", "grammar", "alternatives"
    context: Optional[str] = None
    user_metric: Optional[str] = None  # user-supplied real metric to weave in (never AI-invented)


class RewriteBulletResponse(BaseModel):
    original_text: str
    improved_text: str
    alternatives: List[str] = Field(default_factory=list)
    improvements_made: List[str] = Field(default_factory=list)

# --- Portfolio Models ---

class PortfolioConfig(BaseModel):
    username: str
    theme: str = "modern"  # "modern", "minimal", "professional", "creative", "developer"
    accent_color: str = "#2563EB"
    font_family: str = "Inter"
    visible_sections: List[str] = Field(
        default_factory=lambda: ["about", "skills", "experience", "education", "projects", "contact"]
    )
    is_published: bool = False

class PortfolioProfile(BaseModel):
    portfolio_config: PortfolioConfig
    profile: ResumeProfile
