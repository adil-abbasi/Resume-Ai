from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


# --- User & Auth Models ---

class User(BaseModel):
    id: str
    name: str
    email: str
    plan: Literal["free", "pro", "pro_max"] = "free"
    provider: Literal["local", "google", "github"] = "local"
    avatar_url: Optional[str] = None
    created_at: str = ""
    resumes_count: int = 1
    ai_rewrites_used: int = 0
    favorite_templates: List[str] = Field(default_factory=list)


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    confirm_password: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class SocialAuthRequest(BaseModel):
    provider: Literal["google", "github"]
    token: Optional[str] = "mock_social_token"
    email: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


class UserResponse(BaseModel):
    user: User


# --- Subscription & Plan Models ---

class PlanFeatures(BaseModel):
    plan: Literal["free", "pro", "pro_max"]
    name: str
    price_monthly: float
    price_yearly: float
    features: List[str]
    is_current: bool = False
    badge: Optional[str] = None
    description: Optional[str] = None


class SubscriptionInfo(BaseModel):
    plan: Literal["free", "pro", "pro_max"] = "free"
    status: Literal["active", "cancelled", "trialing", "past_due"] = "active"
    current_period_end: Optional[str] = None
    cancel_at_period_end: bool = False
    payment_method: Optional[str] = None


class UpgradeSubscriptionRequest(BaseModel):
    plan: Literal["pro", "pro_max"] = "pro"
    billing_cycle: Literal["monthly", "yearly"] = "monthly"
    payment_method_id: Optional[str] = "pm_card_mock_visa"


class CheckoutSessionResponse(BaseModel):
    session_id: str
    checkout_url: str
    status: str
    message: str


# --- 100+ Template Models ---

class TemplateItem(BaseModel):
    id: str
    name: str
    description: str
    category: str  # "Modern", "Minimal", "Professional", "Classic", "Creative", "ATS-friendly", "Student", "Executive", "One-page", "Two-page"
    is_pro: bool = False
    thumbnail_color: str = "#2563EB"
    secondary_color: str = "#1E293B"
    font_family: str = "Inter"
    layout_type: str = "two_column"  # "single_column", "two_column", "header_accent", "compact_grid", "minimal_clean"
    spacing: str = "normal"
    tags: List[str] = Field(default_factory=list)
    rating: float = 4.9
    downloads_count: int = 1200
    recommended_for: List[str] = Field(default_factory=list)


class TemplateListResponse(BaseModel):
    total: int
    categories: List[str]
    templates: List[TemplateItem]


# --- Job Search & Candidate Fit Models ---

class JobItem(BaseModel):
    id: str
    title: str
    company: str
    location: str
    type: str  # "Full-time", "Remote", "Contract", "Hybrid"
    salary_range: str
    experience_level: str  # "Entry Level", "Mid-Senior", "Lead", "Executive"
    description: str
    required_skills: List[str]
    preferred_skills: List[str]
    posted_date: str
    logo_emoji: str = "💼"
    remote_status: Optional[str] = "Remote"  # "Remote", "Hybrid", "On-site"
    source: Optional[str] = "LinkedIn"  # "LinkedIn", "Indeed", "Greenhouse", "Lever", "Wellfound", "Company Portal"
    application_link: Optional[str] = ""
    application_status: Optional[str] = "Found"  # "Found", "Ready to Apply", "Applied", "Failed"
    applied_at: Optional[str] = None
    resume_used_id: Optional[str] = None
    notes: Optional[str] = None


class JobSearchQuery(BaseModel):
    query: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    job_type: Optional[str] = None
    remote_only: Optional[bool] = False
    experience_level: Optional[str] = None


class JobFitAnalysis(BaseModel):
    job: JobItem
    match_score: int
    grade: str  # "A+", "A", "B", "C", "Needs Work"
    matched_skills: List[str]
    missing_skills: List[str]
    partially_matching_skills: List[str]
    experience_match: str
    education_match: str
    tailoring_suggestions: List[Dict[str, str]]


# --- Pro Max Agent & LinkedIn Models ---

class JobApplicationRecord(BaseModel):
    id: str
    job_id: str
    job_title: str
    company: str
    location: str
    application_link: str
    applied_at: str
    resume_used: str
    status: Literal["Found", "Ready to Apply", "Applied", "Failed"] = "Applied"
    notes: Optional[str] = ""


class ProfileVerificationResult(BaseModel):
    is_complete: bool
    completion_percentage: int
    missing_fields: List[str]
    present_fields: List[str]
    truthfulness_guidance: str


class LinkedInImportRequest(BaseModel):
    linkedin_url: Optional[str] = ""
    raw_profile_text: Optional[str] = ""  # Supported fallback for pasted export/profile text


class LinkedInImportResponse(BaseModel):
    success: bool
    message: str
    linkedin_url: Optional[str] = ""
    extracted_data: Dict[str, Any]
    unavailable_fields: List[str] = Field(default_factory=list)


class LinkedInResumeGenerateRequest(BaseModel):
    extracted_data: Dict[str, Any]
    existing_profile: Optional[Dict[str, Any]] = None


class LinkedInOAuthUrlResponse(BaseModel):
    configured: bool
    authorization_url: str
    client_id: str
    redirect_uri: str
    state: str
    scopes: List[str]
    message: str


class LinkedInOAuthCallbackRequest(BaseModel):
    code: str
    redirect_uri: Optional[str] = None
    state: Optional[str] = None


class LinkedInOAuthCallbackResponse(BaseModel):
    success: bool
    message: str
    user_info: Dict[str, Any]
    candidate_profile: Dict[str, Any]
    access_token: Optional[str] = None
    generated_resume: Optional[Dict[str, Any]] = None


class LinkedInOAuthSessionResponse(BaseModel):
    success: bool
    message: str
    user_info: Dict[str, Any] = Field(default_factory=dict)
    candidate_profile: Dict[str, Any] = Field(default_factory=dict)
    generated_resume: Optional[Dict[str, Any]] = None


class AgentApplyRequest(BaseModel):
    job: JobItem
    profile: Dict[str, Any]
    notes: Optional[str] = ""


class AgentApplyResponse(BaseModel):
    success: bool
    application_record: JobApplicationRecord
    tailored_resume: Dict[str, Any]
    message: str


# --- Cover Letter Models ---

class CoverLetterRequest(BaseModel):
    job_title: str
    company_name: str
    job_description: Optional[str] = ""
    tone: Optional[str] = "confident"  # "confident", "enthusiastic", "executive", "technical"
    custom_notes: Optional[str] = ""


class CoverLetterResponse(BaseModel):
    recipient_name: str
    company_name: str
    job_title: str
    opening_paragraph: str
    body_paragraphs: List[str]
    closing_paragraph: str
    full_text: str
    matching_keywords_used: List[str]


# --- Web Portfolio Generator Models ---

class PortfolioProject(BaseModel):
    title: str
    description: str
    technologies: List[str]
    live_link: Optional[str] = None
    github_link: Optional[str] = None
    featured: bool = True
    image_url: Optional[str] = None


class PortfolioConfig(BaseModel):
    subdomain: str  # e.g. "alexchen" -> alexchen.careerai.site
    theme: str = "dark_cyber"  # "dark_cyber", "minimal_luxe", "emerald_clean", "obsidian_executive"
    hero_headline: str
    hero_bio: str
    skills_spotlight: List[str]
    projects: List[PortfolioProject]
    experience_timeline: List[Dict[str, Any]]
    social_links: Dict[str, str]
    allow_pdf_download: bool = True
    contact_email_enabled: bool = True
    custom_accent_color: str = "#3B82F6"


class PortfolioDeployRequest(BaseModel):
    config: PortfolioConfig


class PortfolioDeployResponse(BaseModel):
    deployment_id: str
    live_url: str
    status: str
    deployed_at: str
    cdn_region: str
    message: str


# --- GitHub OAuth & Portfolio Publishing Models ---

class GitHubOAuthUrlResponse(BaseModel):
    configured: bool
    authorization_url: str
    client_id: str
    redirect_uri: str
    state: str
    scopes: List[str]
    message: str


class GitHubSessionResponse(BaseModel):
    session_id: str
    username: str
    name: str
    avatar_url: str
    email: str


class GitHubRepoItem(BaseModel):
    name: str
    full_name: str
    private: bool
    html_url: str
    description: str = ""
    updated_at: str = ""


class GitHubPublishRequest(BaseModel):
    session_id: str
    config: "PortfolioConfig"
    repo_name: str
    is_new_repo: bool = True
    is_private: bool = False


class GitHubPublishResponse(BaseModel):
    repo_name: str
    repo_full_name: str
    html_url: str
    pages_url: str
    pushed_files: List[str]
    message: str


# --- Rewarded Ad Models ---

class AdRewardVerificationRequest(BaseModel):
    ad_id: str
    reward_token: str
    duration_seconds: int = 5


class AdRewardVerificationResponse(BaseModel):
    verified: bool
    download_token: str
    message: str

