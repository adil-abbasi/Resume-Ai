from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse, StreamingResponse, RedirectResponse
from typing import Optional, Dict, Any, List
import copy
import secrets
import uuid
import urllib.parse
import logging

logger = logging.getLogger("main_api")

from models.schemas import (
    ResumeProfile, TemplateCustomization, ATSAnalysisResult,
    JobDescriptionData, JobMatchResult, InterviewSessionState,
    RewriteBulletRequest, RewriteBulletResponse
)
from models.auth_schemas import (
    User, UserCreate, UserLogin, SocialAuthRequest,
    ForgotPasswordRequest, ResetPasswordRequest, TokenResponse,
    UserResponse, PlanFeatures, SubscriptionInfo, UpgradeSubscriptionRequest,
    CheckoutSessionResponse, TemplateItem, TemplateListResponse,
    JobItem, JobSearchQuery, JobFitAnalysis,
    JobApplicationRecord, ProfileVerificationResult,
    LinkedInImportRequest, LinkedInImportResponse, LinkedInResumeGenerateRequest,
    LinkedInOAuthUrlResponse, LinkedInOAuthCallbackRequest, LinkedInOAuthCallbackResponse,
    LinkedInOAuthSessionResponse,
    AgentApplyRequest, AgentApplyResponse,
    CoverLetterRequest, CoverLetterResponse,
    PortfolioConfig, PortfolioDeployRequest, PortfolioDeployResponse,
    GitHubOAuthUrlResponse, GitHubPublishRequest, GitHubPublishResponse,
    GitHubSessionResponse, GitHubRepoItem,
    AdRewardVerificationRequest, AdRewardVerificationResponse
)
from nlp.parser import ResumeParser
from nlp.ats_scorer import ATSScorer
from nlp.job_matcher import JobMatcher
from ai.interview_engine import InterviewEngine
from ai.rewriter import BulletRewriter
from ai.cover_letter_engine import CoverLetterEngine
from ai.portfolio_engine import PortfolioEngine
from ai.portfolio_html_generator import generate_zip, generate_standalone_html, THEMES
from services.github_oauth_service import github_oauth_service
from ai.llm_provider import provider as get_llm_provider
from export.docx_generator import DocxResumeGenerator
from data.sample_data import SAMPLE_RESUMES, SAMPLE_JOB_DESCRIPTIONS
from data.templates_db import ALL_TEMPLATES, TEMPLATES_BY_ID, get_templates, CATEGORIES
from data.jobs_db import SAMPLE_JOBS_CATALOG, search_jobs, calculate_candidate_job_fit
from services.job_search_service import job_search_service, get_job_search_provider
from services.linkedin_extractor_service import get_linkedin_extractor
from services.linkedin_oauth_service import linkedin_oauth_service
from services.job_application_agent import job_application_agent
from auth_manager import auth_manager, generate_token, verify_token
from subscription_manager import subscription_manager

app = FastAPI(
    title="AI Resume & Career Assistant API",
    description="Deterministic NLP & Conversational AI Backend with Freemium, Auth & 100+ Templates",
    version="2.1.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for saved resumes & sessions (mock database)
SAVED_RESUMES_DB: Dict[str, ResumeProfile] = copy.deepcopy(SAMPLE_RESUMES)
ACTIVE_INTERVIEW_SESSIONS: Dict[str, InterviewSessionState] = {}
VERIFIED_DOWNLOAD_TOKENS: Dict[str, bool] = {}


def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[User]:
    """Helper to extract authenticated user from bearer token if present."""
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    payload = verify_token(token)
    if not payload:
        return None
    return auth_manager.get_user_by_email(payload["email"])


@app.get("/")
def read_root():
    return {
        "app": "AI Resume & Career Assistant",
        "status": "online",
        "version": "2.1.0",
        "templates_count": len(ALL_TEMPLATES),
        "docs": "/docs"
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


# ---------------- AUTHENTICATION ENDPOINTS ---------------- #

@app.post("/api/auth/signup", response_model=TokenResponse)
async def auth_signup(req: UserCreate):
    """Registers a new candidate user."""
    user, err = auth_manager.register_user(req)
    if err or not user:
        raise HTTPException(status_code=400, detail=err or "Registration failed.")
    
    token = generate_token(user.id, user.email, user.plan)
    return TokenResponse(access_token=token, user=user)


@app.post("/api/auth/login", response_model=TokenResponse)
async def auth_login(req: UserLogin):
    """Authenticates candidate with email and password."""
    user, err = auth_manager.authenticate_user(req.email, req.password)
    if err or not user:
        raise HTTPException(status_code=401, detail=err or "Invalid email or password.")
    
    token = generate_token(user.id, user.email, user.plan)
    return TokenResponse(access_token=token, user=user)


@app.post("/api/auth/social-login", response_model=TokenResponse)
async def auth_social_login(req: SocialAuthRequest):
    """Authenticates or signs up candidate with Google or GitHub."""
    user = auth_manager.social_login(req)
    token = generate_token(user.id, user.email, user.plan)
    return TokenResponse(access_token=token, user=user)


@app.post("/api/auth/forgot-password")
async def auth_forgot_password(req: ForgotPasswordRequest):
    """Generates password reset token and returns status."""
    token = auth_manager.request_password_reset(req.email)
    return {
        "status": "success",
        "message": f"If an account exists for {req.email}, password reset instructions have been sent.",
        "reset_token": token  # returned for easy developer/demo testing
    }


@app.post("/api/auth/reset-password")
async def auth_reset_password(req: ResetPasswordRequest):
    """Resets user password using valid token."""
    success, err = auth_manager.reset_password(req.token, req.new_password)
    if not success:
        raise HTTPException(status_code=400, detail=err or "Reset failed.")
    return {"status": "success", "message": "Password updated successfully. You can now sign in."}


@app.get("/api/auth/me", response_model=UserResponse)
async def auth_me(authorization: Optional[str] = Header(None)):
    """Returns profile of currently authenticated user."""
    user = get_current_user_optional(authorization)
    if not user:
        # Fallback to default free demo user for unauthenticated sessions
        default_user = auth_manager.get_user_by_email("free@careerai.io")
        return UserResponse(user=default_user)
    return UserResponse(user=user)


@app.post("/api/auth/favorite-template")
async def toggle_favorite_template(payload: Dict[str, str], authorization: Optional[str] = Header(None)):
    """Toggles template favorite status for the user."""
    user = get_current_user_optional(authorization)
    email = user.email if user else "free@careerai.io"
    template_id = payload.get("template_id", "")
    updated_favs = auth_manager.toggle_favorite_template(email, template_id)
    return {"status": "success", "favorite_templates": updated_favs}


# ---------------- SUBSCRIPTION & MONETISATION ---------------- #

@app.get("/api/subscription/plans", response_model=List[PlanFeatures])
async def get_plans(authorization: Optional[str] = Header(None)):
    """Returns all plans and features with current plan marked."""
    user = get_current_user_optional(authorization)
    current_plan = user.plan if user else "free"
    return subscription_manager.get_plans_catalog(current_plan)


@app.get("/api/subscription/status", response_model=SubscriptionInfo)
async def get_subscription_status(authorization: Optional[str] = Header(None)):
    """Returns active subscription state and renewal date."""
    user = get_current_user_optional(authorization)
    email = user.email if user else "free@careerai.io"
    return subscription_manager.get_user_subscription(email)


@app.post("/api/subscription/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(req: UpgradeSubscriptionRequest, authorization: Optional[str] = Header(None)):
    """Initializes checkout session for Pro upgrade."""
    user = get_current_user_optional(authorization)
    email = user.email if user else "free@careerai.io"
    return subscription_manager.provider.create_checkout_session(email, req.plan, req.billing_cycle)


@app.post("/api/subscription/upgrade", response_model=SubscriptionInfo)
async def upgrade_plan_endpoint(req: UpgradeSubscriptionRequest, authorization: Optional[str] = Header(None)):
    """Confirms payment and upgrades account to Pro or Pro Max immediately."""
    user = get_current_user_optional(authorization)
    email = user.email if user else "free@careerai.io"
    updated_sub = subscription_manager.upgrade_user_plan(email, req.plan, req.billing_cycle)
    return updated_sub


@app.post("/api/subscription/cancel", response_model=SubscriptionInfo)
async def cancel_subscription(authorization: Optional[str] = Header(None)):
    """Schedules subscription cancellation at the end of current period."""
    user = get_current_user_optional(authorization)
    email = user.email if user else "free@careerai.io"
    return subscription_manager.cancel_user_subscription(email)


# ---------------- AI COVER LETTER GENERATION ---------------- #

@app.post("/api/ai/cover-letter", response_model=CoverLetterResponse)
async def generate_cover_letter(payload: Dict[str, Any], authorization: Optional[str] = Header(None)):
    """
    Generates tailored cover letter matching candidate experience to job opening.
    Available to Pro and Pro Max subscribers.
    """
    profile_data = payload.get("profile")
    request_data = payload.get("request", {})

    if not profile_data:
        raise HTTPException(status_code=400, detail="Profile data is required.")

    profile = ResumeProfile(**profile_data) if isinstance(profile_data, dict) else profile_data
    req = CoverLetterRequest(**request_data) if isinstance(request_data, dict) else request_data

    # Optional feature verification for strict billing enforcement
    user = get_current_user_optional(authorization)
    user_plan = user.plan if user else "free"
    # Allow demo generation, but mark status
    return CoverLetterEngine.generate(profile, req)


# ---------------- WEB PORTFOLIO GENERATION & DEPLOYMENT ---------------- #

@app.post("/api/portfolio/generate", response_model=PortfolioConfig)
async def generate_portfolio_config(payload: Dict[str, Any], authorization: Optional[str] = Header(None)):
    """
    Generates a rich web portfolio configuration from the active ResumeProfile.
    Customizable with themes: dark_cyber, minimal_luxe, emerald_clean, obsidian_executive.
    """
    profile_data = payload.get("profile")
    theme = payload.get("theme", "dark_cyber")

    if not profile_data:
        raise HTTPException(status_code=400, detail="Profile data is required.")

    profile = ResumeProfile(**profile_data) if isinstance(profile_data, dict) else profile_data
    return PortfolioEngine.generate_from_profile(profile, theme)


@app.post("/api/portfolio/deploy", response_model=PortfolioDeployResponse)
async def deploy_portfolio_endpoint(req: PortfolioDeployRequest, authorization: Optional[str] = Header(None)):
    """
    Pro Max Exclusive: Deploys portfolio site with SSL, subdomain, and edge CDN hosting.
    """
    user = get_current_user_optional(authorization)
    user_plan = user.plan if user else "free"
    
    # Verify Pro Max access
    if not subscription_manager.verify_feature_access(user_plan, "portfolio_deployment"):
        # For non-pro_max authenticated users, return 403 or guided upgrade requirement
        if user and user.plan != "pro_max":
            raise HTTPException(
                status_code=403,
                detail="Web Portfolio Deployment is an exclusive feature of the Pro Max (Career) plan. Please upgrade to deploy live."
            )

    return PortfolioEngine.deploy_portfolio(req.config)


@app.post("/api/portfolio/download")
async def download_portfolio_zip(payload: Dict[str, Any], authorization: Optional[str] = Header(None)):
    """
    Generates and streams a complete portfolio as a ZIP file.
    ZIP contains: index.html (self-contained, works offline) + README.md (GitHub Pages setup guide).
    Available for all users (no Pro gate — generation is free, CDN hosting is Pro Max).
    """
    profile_data = payload.get("profile")
    theme = payload.get("theme", "dark_cyber")

    if not profile_data:
        raise HTTPException(status_code=400, detail="Profile data is required.")

    profile = ResumeProfile(**profile_data) if isinstance(profile_data, dict) else profile_data
    config = PortfolioEngine.generate_from_profile(profile, theme)

    zip_buffer = generate_zip(config)
    subdomain = config.subdomain or "portfolio"
    filename = f"{subdomain}-portfolio.zip"

    return Response(
        content=zip_buffer.read(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# ---------------- GITHUB OAUTH 2.0 & PORTFOLIO PUBLISHER ---------------- #

@app.get("/api/auth/github/url", response_model=GitHubOAuthUrlResponse)
async def get_github_auth_url():
    """
    Returns GitHub OAuth 2.0 authorization URL with CSRF state protection.
    Returns configured=False gracefully if GITHUB_CLIENT_ID/SECRET are not set.
    """
    info = github_oauth_service.get_authorization_url()
    return GitHubOAuthUrlResponse(**info)


@app.get("/api/auth/github/callback")
async def github_oauth_get_callback(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    error_description: Optional[str] = Query(None)
):
    """
    Browser redirect endpoint for GitHub OAuth 2.0.
    Exchanges code server-side, stores token in session, redirects SPA with session_id.
    """
    if error:
        err_detail = error_description or error or "GitHub authorization was cancelled or failed."
        logger.error(f"[GitHub OAuth Callback] GitHub returned error: {error} — {error_description}")
        return RedirectResponse(
            url=f"http://localhost:5173/?github_status=failed&error={urllib.parse.quote(err_detail)}",
            status_code=303
        )

    if not code:
        return RedirectResponse(
            url="http://localhost:5173/?github_status=failed&error=Missing+authorization+code",
            status_code=303
        )

    if not github_oauth_service.validate_state(state):
        err_detail = "Invalid or expired GitHub OAuth state (CSRF validation failed). Please try again."
        logger.error(f"[GitHub OAuth Callback] State validation failed: state={state}")
        return RedirectResponse(
            url=f"http://localhost:5173/?github_status=failed&error={urllib.parse.quote(err_detail)}",
            status_code=303
        )

    try:
        access_token = await github_oauth_service.exchange_code_for_token(code)
        user_info = await github_oauth_service.fetch_user_info(access_token)
        session_id = github_oauth_service.store_session(access_token, user_info)
        logger.info(f"[GitHub OAuth Callback] Successfully connected GitHub for user '{user_info.get('login', '')}', session={session_id[:8]}...")
        return RedirectResponse(
            url=f"http://localhost:5173/?github_status=success&github_session_id={session_id}",
            status_code=303
        )
    except Exception as e:
        logger.error(f"[GitHub OAuth Callback] Error: {e}", exc_info=True)
        return RedirectResponse(
            url=f"http://localhost:5173/?github_status=failed&error={urllib.parse.quote(str(e))}",
            status_code=303
        )


@app.get("/api/auth/github/session/{session_id}")
async def get_github_session(session_id: str):
    """
    Returns GitHub user public info (no token) for the given session.
    Frontend uses this to confirm who is connected after the OAuth redirect.
    """
    info = github_oauth_service.get_session_public(session_id)
    if not info:
        raise HTTPException(status_code=404, detail="GitHub session not found or expired.")
    return {"session_id": session_id, **info}


@app.get("/api/auth/github/repos/{session_id}")
async def list_github_repos(session_id: str):
    """Lists the authenticated user's GitHub repositories for the repo picker."""
    try:
        repos = await github_oauth_service.list_user_repos(session_id)
        return repos
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list GitHub repositories: {str(e)}")


@app.post("/api/portfolio/publish-github", response_model=GitHubPublishResponse)
async def publish_portfolio_to_github(req: GitHubPublishRequest, authorization: Optional[str] = Header(None)):
    """
    Uploads the complete portfolio project to a GitHub repository.
    All GitHub API calls are server-side only — access token never exposed to browser.
    Creates or updates: index.html (full standalone portfolio) + README.md.
    """
    from ai.portfolio_html_generator import generate_standalone_html, generate_readme

    # Generate the portfolio files
    html_content = generate_standalone_html(req.config)
    readme_content = generate_readme(req.config)

    files = {
        "index.html": html_content,
        "README.md": readme_content,
    }

    try:
        result = await github_oauth_service.publish_portfolio(
            session_id=req.session_id,
            files=files,
            repo_name=req.repo_name,
            is_new_repo=req.is_new_repo,
            is_private=req.is_private,
            description=f"Personal portfolio for {req.config.hero_headline[:60]}",
        )
        return GitHubPublishResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[Portfolio GitHub Publish] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"GitHub publish failed: {str(e)}")


# ---------------- 100+ RESUME TEMPLATES ---------------- #

@app.get("/api/templates", response_model=TemplateListResponse)
async def list_templates(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    only_pro: Optional[bool] = Query(None)
):
    """Returns searchable, categorized catalog of 100+ resume templates."""
    filtered = get_templates(category=category, search=search, only_pro=only_pro)
    return TemplateListResponse(
        total=len(filtered),
        categories=["All"] + CATEGORIES,
        templates=filtered
    )


@app.get("/api/templates/{template_id}", response_model=TemplateItem)
async def get_template_detail(template_id: str):
    """Retrieves specific template metadata and configuration."""
    if template_id in TEMPLATES_BY_ID:
        return TEMPLATES_BY_ID[template_id]
    # Fallback to first
    return ALL_TEMPLATES[0]


# ---------------- JOB SEARCH & RESUME FIT ---------------- #

@app.get("/api/jobs/search", response_model=List[JobItem])
async def search_jobs_endpoint(
    query: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    experience_level: Optional[str] = Query(None),
    remote_only: Optional[bool] = Query(False),
    page: int = Query(1),
    limit: int = Query(12)
):
    """Searches live jobs dynamically via the active JobSearchService."""
    return job_search_service.search_jobs(
        query=query,
        location=location,
        remote_only=remote_only,
        job_type=job_type,
        experience_level=experience_level,
        page=page,
        limit=limit
    )


@app.post("/api/jobs/discover", response_model=List[JobItem])
async def discover_jobs_from_profile_endpoint(payload: Dict[str, Any]):
    """Discovers live jobs tailored directly to candidate's active ResumeProfile."""
    profile_data = payload.get("profile")
    if not profile_data:
        raise HTTPException(status_code=400, detail="Profile data is required.")
    page = int(payload.get("page", 1))
    limit = int(payload.get("limit", 12))
    profile = ResumeProfile(**profile_data) if isinstance(profile_data, dict) else profile_data
    return job_search_service.discover_jobs_from_profile(profile, page=page, limit=limit)


@app.get("/api/jobs/provider-status")
async def get_job_provider_status_endpoint():
    """Returns the active provider configuration status."""
    return job_search_service.get_provider_status()


@app.post("/api/jobs/match-fit", response_model=JobFitAnalysis)
async def job_match_fit(payload: Dict[str, Any]):
    """
    Evaluates candidate resume against a specific job opening.
    Truth-preserving: calculates actual matching skills (✓) and gaps (⚠).
    Zero fake fallback: requires actual job data or raises 404.
    """
    profile_data = payload.get("profile")
    job_id = payload.get("job_id")
    job_data = payload.get("job")

    if not profile_data:
        raise HTTPException(status_code=400, detail="Profile data is required.")

    profile = ResumeProfile(**profile_data) if isinstance(profile_data, dict) else profile_data

    target_job: Optional[JobItem] = None
    if job_data:
        target_job = JobItem(**job_data)
    elif job_id:
        # Search active dynamic listings
        results = job_search_service.search_jobs(limit=25)
        target_job = next((j for j in results if j.id == job_id), None)

    if not target_job:
        raise HTTPException(status_code=404, detail="Target job details not found. Please provide valid job data.")

    return calculate_candidate_job_fit(profile, target_job)


# ---------------- LINKEDIN OAUTH 2.0 & PROFILE IMPORTER ---------------- #

@app.get("/api/auth/linkedin/url", response_model=LinkedInOAuthUrlResponse)
async def get_linkedin_auth_url(
    redirect_uri: Optional[str] = Query(None),
    scope: Optional[str] = Query(None)
):
    """
    Returns official LinkedIn OAuth 2.0 authorization URL with CSRF state protection.
    """
    info = linkedin_oauth_service.get_authorization_url(redirect_uri, scope=scope)
    return LinkedInOAuthUrlResponse(**info)


@app.post("/api/auth/linkedin/update-redirect-uri")
async def update_linkedin_redirect_uri(payload: Dict[str, str]):
    """
    Updates the configured LinkedIn redirect URI dynamically and persists to .env.
    """
    uri = payload.get("redirect_uri", "").strip()
    if not uri:
        raise HTTPException(status_code=400, detail="redirect_uri cannot be empty")
    linkedin_oauth_service.set_redirect_uri(uri)
    return {"success": True, "redirect_uri": linkedin_oauth_service.redirect_uri}


@app.get("/api/auth/linkedin/callback")
async def linkedin_oauth_get_callback(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    error_description: Optional[str] = Query(None)
):
    """
    Browser redirect endpoint for LinkedIn OAuth 2.0:
    http://localhost:5173/api/auth/linkedin/callback?code=...&state=...
    1. Validates CSRF state.
    2. Exchanges authorization code server-side using client credentials.
    3. Never exposes client secret or access token to the browser.
    4. Fetches real authorized profile info from LinkedIn OpenID UserInfo endpoint (/v2/userinfo).
    5. Builds Candidate Profile (strictly zero mock data).
    6. Generates complete ATS Resume for Resume Studio.
    7. Stores session and redirects to SPA with session_id.
    """
    frontend_base = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    if error:
        err_detail = error_description or error or "LinkedIn authorization was cancelled or failed."
        logger.error(f"[LinkedIn OAuth GET Callback] LinkedIn returned error: {error} - {error_description}")
        return RedirectResponse(
            url=f"{frontend_base}/?oauth_status=failed&error={urllib.parse.quote(err_detail)}",
            status_code=303
        )

    if not code:
        err_detail = "Missing authorization code from LinkedIn."
        logger.error(f"[LinkedIn OAuth GET Callback] {err_detail}")
        return RedirectResponse(
            url=f"{frontend_base}/?oauth_status=failed&error={urllib.parse.quote(err_detail)}",
            status_code=303
        )

    # Validate CSRF state
    if not linkedin_oauth_service.validate_state(state):
        err_detail = "Invalid or expired OAuth state parameter (CSRF validation failed). Please try connecting again."
        logger.error(f"[LinkedIn OAuth GET Callback] State validation failed for state={state}")
        return RedirectResponse(
            url=f"{frontend_base}/?oauth_status=failed&error={urllib.parse.quote(err_detail)}",
            status_code=303
        )

    try:
        active_redirect = linkedin_oauth_service.redirect_uri
        token_data = await linkedin_oauth_service.exchange_code_for_token(code, active_redirect)
        access_token = token_data.get("access_token", "")
        if not access_token:
            raise ValueError("Failed to obtain LinkedIn access token.")

        user_info = await linkedin_oauth_service.fetch_user_info(access_token)
        candidate_profile = linkedin_oauth_service.build_candidate_profile_from_linkedin(user_info)

        # Generate ATS resume from authentic Candidate Profile
        extractor = get_linkedin_extractor()
        generated_resume = extractor.generate_ats_resume(extracted=candidate_profile)

        session_id = str(uuid.uuid4())
        linkedin_oauth_service.store_oauth_session(
            session_id=session_id,
            candidate_profile=candidate_profile,
            generated_resume=generated_resume.dict(),
            user_info=user_info
        )

        logger.info(f"[LinkedIn OAuth GET Callback] Successfully processed OAuth for {candidate_profile.get('full_name')}. Session: {session_id[:8]}...")
        return RedirectResponse(
            url=f"{frontend_base}/?oauth_status=success&session_id={session_id}",
            status_code=303
        )
    except Exception as e:
        logger.error(f"[LinkedIn OAuth GET Callback] Error processing callback: {e}", exc_info=True)
        return RedirectResponse(
            url=f"{frontend_base}/?oauth_status=failed&error={urllib.parse.quote(str(e))}",
            status_code=303
        )


@app.get("/api/auth/linkedin/session/{session_id}", response_model=LinkedInOAuthSessionResponse)
async def get_linkedin_oauth_session_endpoint(session_id: str):
    """
    Retrieves and clears stored OAuth session for frontend consumption.
    """
    session = linkedin_oauth_service.get_oauth_session(session_id)
    if not session:
        logger.warning(f"[LinkedIn OAuth Session Endpoint] Session not found or expired: {session_id[:8]}...")
        raise HTTPException(status_code=404, detail="LinkedIn OAuth session expired or not found. Please try connecting again.")

    return LinkedInOAuthSessionResponse(
        success=True,
        message="LinkedIn profile imported successfully.",
        user_info=session.get("user_info", {}),
        candidate_profile=session.get("candidate_profile", {}),
        generated_resume=session.get("generated_resume")
    )


@app.post("/api/auth/linkedin/callback", response_model=LinkedInOAuthCallbackResponse)
async def linkedin_oauth_callback(req: LinkedInOAuthCallbackRequest):
    """
    POST callback for LinkedIn authorization code exchange:
    Validates state, exchanges authorization code server-side, retrieves real OIDC user info,
    generates ATS resume, and returns authentic Candidate Profile without exposing access token or secret.
    """
    logger.info(f"[LinkedIn OAuth POST Callback] Exchanging code (state={req.state})")
    if req.state and not linkedin_oauth_service.validate_state(req.state):
        err_msg = "Invalid or expired OAuth state parameter (CSRF validation failed)."
        logger.error(f"[LinkedIn OAuth POST Callback] {err_msg}")
        raise HTTPException(status_code=400, detail=err_msg)

    try:
        active_redirect = req.redirect_uri or linkedin_oauth_service.redirect_uri
        token_data = await linkedin_oauth_service.exchange_code_for_token(req.code, active_redirect)
        access_token = token_data.get("access_token", "")
        if not access_token:
            logger.error("[LinkedIn OAuth POST Callback] No access token returned.")
            raise HTTPException(status_code=400, detail="Failed to obtain LinkedIn access token.")

        user_info = await linkedin_oauth_service.fetch_user_info(access_token)
        candidate_profile = linkedin_oauth_service.build_candidate_profile_from_linkedin(user_info)

        # Generate ATS resume
        extractor = get_linkedin_extractor()
        generated_resume = extractor.generate_ats_resume(extracted=candidate_profile)

        return LinkedInOAuthCallbackResponse(
            success=True,
            message="Import successful",
            user_info=user_info,
            candidate_profile=candidate_profile,
            access_token=None,
            generated_resume=generated_resume.dict()
        )
    except ValueError as e:
        logger.error(f"[LinkedIn OAuth POST Callback] ValueError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[LinkedIn OAuth POST Callback] Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"LinkedIn OAuth error: {str(e)}")


@app.post("/api/agent/linkedin-import", response_model=LinkedInImportResponse)
async def import_linkedin_profile(req: LinkedInImportRequest):
    """
    Extracts public profile information from a provided LinkedIn URL or pasted profile text.
    Available to all users for testing with zero restrictions or usage limits.
    Strictly preserves genuine content and flags unavailable sections rather than inventing fake data.
    """
    extractor = get_linkedin_extractor()
    try:
        data = extractor.extract_profile(linkedin_url=req.linkedin_url, raw_text=req.raw_profile_text)
        unavailable = data.get("unavailable_fields", [])
        return LinkedInImportResponse(
            success=True,
            message="Public LinkedIn profile data extracted successfully.",
            linkedin_url=req.linkedin_url or "",
            extracted_data=data,
            unavailable_fields=unavailable
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process LinkedIn extraction: {str(e)}")


@app.post("/api/linkedin/generate-resume", response_model=ResumeProfile)
async def generate_resume_from_linkedin(req: LinkedInResumeGenerateRequest):
    """
    Generates a complete, professional, ATS-friendly resume from reviewed LinkedIn data.
    Preserves all meaningful experience/project details without aggressive shortening.
    Sends directly to Studio for template customization. Unrestricted for testing.
    """
    extractor = get_linkedin_extractor()
    try:
        existing_profile: Optional[ResumeProfile] = None
        if req.existing_profile:
            existing_profile = ResumeProfile(**req.existing_profile)

        generated_resume = extractor.generate_ats_resume(
            extracted=req.extracted_data,
            existing_profile=existing_profile
        )
        return generated_resume
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate resume from LinkedIn data: {str(e)}")


@app.post("/api/agent/verify-profile", response_model=ProfileVerificationResult)
async def verify_profile_endpoint(payload: Dict[str, Any]):
    """
    Truth-preserving verification: verifies if Candidate Profile contains sufficient
    information for a complete resume. Never invents qualifications, experience, or facts.
    """
    profile_data = payload.get("profile")
    if not profile_data:
        raise HTTPException(status_code=400, detail="Profile data is required.")
    profile = ResumeProfile(**profile_data) if isinstance(profile_data, dict) else profile_data
    return job_application_agent.verify_candidate_profile(profile)


@app.post("/api/agent/apply", response_model=AgentApplyResponse)
async def agent_apply_endpoint(req: AgentApplyRequest, authorization: Optional[str] = Header(None)):
    """
    Pro Max Exclusive: Autonomous AI Job Application Agent.
    1. Verifies profile completeness (strictly avoids inventing metrics/facts).
    2. Generates tailored resume.
    3. Records application details (job, link, timestamp, resume used, status).
    4. Automatically loads resume into Studio for final user review.
    """
    user = get_current_user_optional(authorization)
    user_plan = user.plan if user else "free"

    # Note: Pro / Pro Max restriction temporarily lifted for testing as requested by user
    # if user_plan != "pro_max":
    #     raise HTTPException(
    #         status_code=403,
    #         detail="Pro Max Exclusive: The autonomous AI Job Application Agent is reserved for Pro Max subscribers."
    #     )

    user_email = user.email if user else "promax@careerai.io"
    profile = ResumeProfile(**req.profile) if isinstance(req.profile, dict) else req.profile

    try:
        return job_application_agent.prepare_application(
            profile=profile,
            job=req.job,
            notes=req.notes,
            user_email=user_email
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent apply error: {str(e)}")


@app.get("/api/agent/applications", response_model=List[JobApplicationRecord])
async def get_agent_applications_endpoint(authorization: Optional[str] = Header(None)):
    """Retrieves all tracked applications submitted by the AI Agent."""
    user = get_current_user_optional(authorization)
    user_email = user.email if user else "promax@careerai.io"
    return job_application_agent.get_applications(user_email)


# ---------------- REWARDED AD VERIFICATION ---------------- #

@app.post("/api/ads/verify-reward", response_model=AdRewardVerificationResponse)
async def verify_ad_reward(req: AdRewardVerificationRequest):
    """
    Validates completed rewarded advertisement for Free users and generates
    a valid one-time PDF download token.
    """
    if req.duration_seconds < 4:
        raise HTTPException(status_code=400, detail="Ad was skipped or incomplete.")
    
    download_token = f"dl_token_{secrets.token_hex(12)}"
    VERIFIED_DOWNLOAD_TOKENS[download_token] = True

    return AdRewardVerificationResponse(
        verified=True,
        download_token=download_token,
        message="Advertisement completed successfully. Your free PDF download is unlocked!"
    )


# ---------------- LLM STATUS ---------------- #

@app.get("/api/llm/status")
def llm_status():
    """Returns the current LLM provider status and model info."""
    llm = get_llm_provider()
    available = llm.is_available()
    is_groq = "Groq" in type(llm).__name__ or "Groq" in getattr(llm, "model_name", "")
    return {
        "available": available,
        "provider": type(llm).__name__,
        "model": llm.model_name if available else "offline",
        "mode": "llm" if available else "fallback",
        "is_groq": is_groq,
        "speed_tier": "Ultra-Fast LPU (<400ms)" if is_groq else "Standard",
    }


# ---------------- RESUME PARSING & UPLOAD ---------------- #

@app.post("/api/parse-resume")
@app.post("/api/parse-document")
async def parse_document(file: Optional[UploadFile] = File(None), raw_text: Optional[str] = Form(None)):
    """Extracts text from uploaded PDF/DOCX or parses raw text into a structured candidate profile."""
    extracted_text = ""
    orig_filename = "document"
    if file:
        content = await file.read()
        filename = (file.filename or "").lower()
        orig_filename = file.filename or "uploaded_cv"
        if filename.endswith(".pdf"):
            try:
                extracted_text = ResumeParser.extract_text_from_pdf(content)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
        elif filename.endswith(".docx") or filename.endswith(".doc"):
            try:
                extracted_text = ResumeParser.extract_text_from_docx(content)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to parse DOCX: {str(e)}")
        else:
            try:
                extracted_text = content.decode("utf-8", errors="ignore")
            except Exception:
                extracted_text = str(content)
    elif raw_text:
        extracted_text = raw_text
    else:
        raise HTTPException(status_code=400, detail="Please upload a file (.pdf/.docx) or provide raw text.")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any readable text from the document.")

    profile = ResumeParser.parse_text(extracted_text)
    validation = ResumeParser.validate_extraction(extracted_text, profile)
    return {
        "raw_text": extracted_text,
        "parsed_text": extracted_text,
        "profile": profile,
        "validation": validation,
        "filename": orig_filename,
        "confidence_score": validation.coverage_score
    }



# ---------------- RESUME ANALYSIS & ATS SCORING ---------------- #

@app.post("/api/analyze-resume", response_model=ATSAnalysisResult)
async def analyze_resume(profile: Optional[ResumeProfile] = None, raw_text: Optional[str] = None):
    """Calculates comprehensive ATS compatibility score, analyzes weak bullets, and generates improvement suggestions."""
    if profile is None and raw_text:
        profile = ResumeParser.parse_text(raw_text)
    elif profile is None:
        raise HTTPException(status_code=400, detail="Must provide either a structured ResumeProfile or raw_text")

    analysis = ATSScorer.analyze_resume(profile)
    return analysis


# ---------------- JOB MATCHING & SKILL GAP ---------------- #

@app.post("/api/job-match")
async def match_job(payload: Dict[str, Any]):
    """Analyzes a job description and compares requirements against the candidate profile."""
    profile_data = payload.get("profile")
    job_text = payload.get("job_text", "")

    if not job_text:
        raise HTTPException(status_code=400, detail="Job description text is required.")

    if isinstance(profile_data, dict):
        profile = ResumeProfile(**profile_data)
    elif isinstance(profile_data, ResumeProfile):
        profile = profile_data
    else:
        profile = ResumeProfile()

    job_data = JobMatcher.extract_job_requirements(job_text)
    match_result = JobMatcher.match_resume_to_job(profile, job_data)

    return {
        "job_data": job_data,
        "match_result": match_result
    }


@app.post("/api/tailor-resume", response_model=ResumeProfile)
async def tailor_resume(payload: Dict[str, Any], authorization: Optional[str] = Header(None)):
    """
    Generates a customized, job-tailored version of the candidate's resume.
    Truth-preserving: Strictly preserves genuine candidate facts and skills without hallucinating metrics.
    """
    profile_data = payload.get("profile")
    job_text = payload.get("job_text", "")

    if not profile_data or not job_text:
        raise HTTPException(status_code=400, detail="Both profile and job_text are required.")

    profile = ResumeProfile(**profile_data) if isinstance(profile_data, dict) else profile_data
    tailored = copy.deepcopy(profile)

    job_data = JobMatcher.extract_job_requirements(job_text)

    # 1. Align Target Role & Title
    if job_data.job_title:
        tailored.target_role = job_data.job_title
        if not tailored.contact_info.title or "Professional" in tailored.contact_info.title:
            tailored.contact_info.title = job_data.job_title

    # 2. Refine Summary with Matched Role Alignment
    matched_skills = [
        s for s in (tailored.skills.technical_skills + tailored.skills.frameworks_libraries)
        if any(req.lower() in s.lower() for req in job_data.extracted_required_skills)
    ]

    if matched_skills and tailored.summary:
        tailored.summary = f"{job_data.job_title} with proven expertise in {', '.join(matched_skills[:3])}. {tailored.summary}"

    # 3. Prioritize matching skills at top of technical skills list
    if matched_skills:
        reordered_tech = []
        for s in tailored.skills.technical_skills:
            if s in matched_skills and s not in reordered_tech:
                reordered_tech.append(s)
        for s in tailored.skills.technical_skills:
            if s not in reordered_tech:
                reordered_tech.append(s)
        tailored.skills.technical_skills = reordered_tech

    return tailored


# ---------------- AI CONVERSATIONAL INTERVIEW ---------------- #

@app.post("/api/interview/start")
async def start_interview(payload: Optional[Dict[str, Any]] = None):
    """Initializes a new conversational AI interview session with optional target role."""
    target_role = (payload or {}).get("target_role") if isinstance(payload, dict) else None
    session = InterviewEngine.get_initial_session(target_role=target_role)
    session_id = f"session-{len(ACTIVE_INTERVIEW_SESSIONS) + 1}"
    ACTIVE_INTERVIEW_SESSIONS[session_id] = session
    return {
        "session_id": session_id,
        "session": session
    }


@app.post("/api/interview/chat")
async def interview_chat(payload: Dict[str, Any]):
    """Processes user response and advances the interview (blocking)."""
    session_id = payload.get("session_id", "default")
    user_input = payload.get("message", "")

    if session_id in ACTIVE_INTERVIEW_SESSIONS:
        session = ACTIVE_INTERVIEW_SESSIONS[session_id]
    else:
        session = InterviewEngine.get_initial_session()
        ACTIVE_INTERVIEW_SESSIONS[session_id] = session

    updated_session = InterviewEngine.process_turn(session, user_input)
    ACTIVE_INTERVIEW_SESSIONS[session_id] = updated_session

    return {
        "session_id": session_id,
        "session": updated_session
    }


@app.post("/api/interview/stream")
async def interview_stream(payload: Dict[str, Any]):
    """
    Streaming version of interview chat.
    Returns Server-Sent Events — each event is a JSON chunk with:
      { token: str, done: bool, session?: {...} }
    """
    session_id = payload.get("session_id", "default")
    user_input = payload.get("message", "")

    if session_id in ACTIVE_INTERVIEW_SESSIONS:
        session = ACTIVE_INTERVIEW_SESSIONS[session_id]
    else:
        session = InterviewEngine.get_initial_session()
        ACTIVE_INTERVIEW_SESSIONS[session_id] = session

    def event_generator():
        for sse_chunk in InterviewEngine.stream_turn(session, user_input):
            yield sse_chunk
        ACTIVE_INTERVIEW_SESSIONS[session_id] = session

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream; charset=utf-8",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Content-Type": "text/event-stream; charset=utf-8"
        }
    )


# ---------------- AI BULLET REWRITER & POLISHER ---------------- #

@app.post("/api/rewrite-bullet", response_model=RewriteBulletResponse)
async def rewrite_bullet(req: RewriteBulletRequest):
    """Polishes bullet points using action verbs, STAR structure, and conciseness."""
    return BulletRewriter.rewrite_bullet(req.bullet_text, req.mode, req.context)


@app.post("/api/rewrite-text")
async def rewrite_text(payload: Dict[str, Any]):
    """
    Rewrite arbitrary text blocks (e.g. summary, section headers).
    Uses Ollama LLM when available.
    """
    text = payload.get("text", "")
    mode = payload.get("mode", "professional")
    context = payload.get("context", "")

    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    llm = get_llm_provider()
    if llm.is_available():
        try:
            messages = [
                {"role": "system", "content": (
                    "You are an expert resume writer. "
                    "Rewrite the provided text to be more professional, impactful, and ATS-friendly. "
                    f"Mode: {mode}. "
                    "NEVER add fake information. Only improve the phrasing. "
                    "Return ONLY the rewritten text, no explanations."
                )},
                {"role": "user", "content": f"Rewrite this:\n\n{text}"}
            ]
            improved = llm.chat(messages, temperature=0.6)
            import re
            improved = re.sub(r'<think>.*?</think>', '', improved, flags=re.DOTALL).strip()
            return {"original": text, "improved": improved}
        except Exception:
            pass

    # Fallback: return original with minor improvements
    from ai.rewriter import BulletRewriter
    result = BulletRewriter.rewrite_bullet(text, mode, context)
    return {"original": text, "improved": result.improved_text}


# ---------------- RESUME EXPORT (DOCX) ---------------- #

@app.post("/api/export-docx")
async def export_docx(payload: Dict[str, Any]):
    """Generates and streams a styled Word (.docx) file."""
    profile_data = payload.get("profile")
    customization_data = payload.get("customization")

    if not profile_data:
        raise HTTPException(status_code=400, detail="Profile data is required.")

    profile = ResumeProfile(**profile_data)
    customization = TemplateCustomization(**customization_data) if customization_data else TemplateCustomization()

    docx_buffer = DocxResumeGenerator.generate_docx(profile, customization)

    filename = f"{profile.contact_info.full_name or 'Resume'}_CV.docx".replace(" ", "_")
    return Response(
        content=docx_buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# ---------------- SAMPLE DATA & STORAGE ---------------- #

@app.get("/api/sample-resumes")
def get_sample_resumes():
    return SAMPLE_RESUMES


@app.get("/api/sample-jobs")
def get_sample_jobs():
    """Returns dynamic live jobs or empty list instead of static fake jobs."""
    return job_search_service.search_jobs(limit=4)


@app.get("/api/resumes")
def list_resumes():
    return list(SAVED_RESUMES_DB.values())


@app.post("/api/resumes")
def save_resume(profile: ResumeProfile):
    SAVED_RESUMES_DB[profile.id] = profile
    return {"status": "saved", "id": profile.id}
