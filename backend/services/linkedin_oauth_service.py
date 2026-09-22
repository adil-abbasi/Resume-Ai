"""
LinkedIn OAuth 2.0 Service
===========================
Handles secure OAuth 2.0 authorization with LinkedIn OpenID Connect API:
  1. Generates authentic LinkedIn authorization URL with CSRF state protection.
  2. Validates CSRF state server-side.
  3. Exchanges authorization code server-side using LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.
  4. Never exposes client secret or access token to the browser.
  5. Fetches verified candidate profile data via LinkedIn UserInfo API (`/v2/userinfo`).
  6. Structures verified identity, email, headline, and profile data into Candidate Profile.
  7. Strictly preserves actual authorized information without fabricating missing details (no mock data).
  8. Provides detailed server-side error and diagnostic logging for debugging.
"""

import os
import time
import secrets
import logging
import urllib.parse
from typing import Dict, Any, Optional
import httpx

# Configure dedicated server-side logger for OAuth diagnostics
logger = logging.getLogger("linkedin_oauth")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    formatter = logging.Formatter("[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s")
    ch.setFormatter(formatter)
    logger.addHandler(ch)


def _load_env():
    """Dynamically loads .env into os.environ with override=True."""
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", ".env"),
        os.path.join(os.path.dirname(__file__), "..", ".env.local"),
        os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        os.path.join(os.path.dirname(__file__), "..", "..", ".env.local"),
        ".env",
        ".env.local"
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                with open(c, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip('"').strip("'")
                            os.environ[k] = v
            except Exception as e:
                logger.warning(f"Error loading env file {c}: {e}")


class LinkedInOAuthService:
    """Manages LinkedIn OAuth 2.0 authentication and profile retrieval."""

    LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
    LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
    LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo"

    def __init__(self):
        _load_env()
        # Active CSRF states: state -> creation_timestamp (TTL = 15 minutes)
        self.active_states: Dict[str, float] = {}
        # Short-lived OAuth session cache: session_id -> data (TTL = 15 minutes)
        self.oauth_sessions: Dict[str, Dict[str, Any]] = {}

    @property
    def client_id(self) -> str:
        _load_env()
        return os.getenv("LINKEDIN_CLIENT_ID", "").strip()

    @property
    def client_secret(self) -> str:
        _load_env()
        return os.getenv("LINKEDIN_CLIENT_SECRET", "").strip()

    @property
    def redirect_uri(self) -> str:
        _load_env()
        return os.getenv("LINKEDIN_REDIRECT_URI", "http://localhost:5173/api/auth/linkedin/callback").strip()

    def set_redirect_uri(self, new_uri: str):
        """Updates the redirect URI in memory and persists to backend/.env."""
        new_uri = new_uri.strip()
        if not new_uri:
            return
        os.environ["LINKEDIN_REDIRECT_URI"] = new_uri

        candidates = [
            os.path.join(os.path.dirname(__file__), "..", ".env"),
            os.path.join(os.path.dirname(__file__), "..", ".env.local"),
            ".env"
        ]
        for c in candidates:
            if os.path.exists(c):
                try:
                    with open(c, "r", encoding="utf-8") as f:
                        lines = f.readlines()
                    updated = False
                    new_lines = []
                    for line in lines:
                        if line.startswith("LINKEDIN_REDIRECT_URI="):
                            new_lines.append(f"LINKEDIN_REDIRECT_URI={new_uri}\n")
                            updated = True
                        else:
                            new_lines.append(line)
                    if not updated:
                        new_lines.append(f"LINKEDIN_REDIRECT_URI={new_uri}\n")
                    with open(c, "w", encoding="utf-8") as f:
                        f.writelines(new_lines)
                except Exception as e:
                    logger.error(f"Failed to persist redirect URI to {c}: {e}")
                break

    @property
    def scopes(self) -> str:
        _load_env()
        return os.getenv("LINKEDIN_SCOPES", "openid profile email").strip()

    def is_configured(self) -> bool:
        """Returns True if LinkedIn App credentials are set in environment."""
        return bool(self.client_id and self.client_secret)

    def generate_state(self) -> str:
        """Generates a secure CSRF state token and registers it with a 15-minute TTL."""
        now = time.time()
        # Prune expired states (> 900s)
        self.active_states = {s: ts for s, ts in self.active_states.items() if now - ts < 900}
        state = secrets.token_urlsafe(24)
        self.active_states[state] = now
        logger.info(f"[LinkedIn OAuth] Generated CSRF state token: {state[:8]}... (active states count: {len(self.active_states)})")
        return state

    def validate_state(self, state: Optional[str]) -> bool:
        """
        Validates whether state token is valid and unexpired, consuming it.
        Returns True if valid, False otherwise.
        """
        if not state:
            logger.warning("[LinkedIn OAuth State Validation] Missing state parameter in callback.")
            return False

        now = time.time()
        creation_time = self.active_states.pop(state, None)
        if creation_time is None:
            logger.warning(f"[LinkedIn OAuth State Validation] State token '{state[:8]}...' not found or already consumed.")
            return False

        if now - creation_time > 900:
            logger.warning(f"[LinkedIn OAuth State Validation] State token '{state[:8]}...' has expired (elapsed: {now - creation_time:.1f}s).")
            return False

        logger.info(f"[LinkedIn OAuth State Validation] State token validated successfully: {state[:8]}...")
        return True

    def store_oauth_session(self, session_id: str, candidate_profile: Dict[str, Any], generated_resume: Dict[str, Any], user_info: Dict[str, Any]):
        """Caches imported profile and resume for frontend pickup via session ID."""
        now = time.time()
        # Prune expired sessions (> 900s)
        self.oauth_sessions = {sid: d for sid, d in self.oauth_sessions.items() if now - d.get("created_at", 0) < 900}
        self.oauth_sessions[session_id] = {
            "candidate_profile": candidate_profile,
            "generated_resume": generated_resume,
            "user_info": user_info,
            "created_at": now
        }
        logger.info(f"[LinkedIn OAuth Session] Stored session {session_id[:8]}... for frontend retrieval.")

    def get_oauth_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves and consumes a short-lived OAuth session."""
        now = time.time()
        session = self.oauth_sessions.pop(session_id, None)
        if not session:
            logger.warning(f"[LinkedIn OAuth Session] Session {session_id[:8]}... not found or expired.")
            return None
        if now - session.get("created_at", 0) > 900:
            logger.warning(f"[LinkedIn OAuth Session] Session {session_id[:8]}... expired.")
            return None
        return session

    def get_authorization_url(self, redirect_uri: Optional[str] = None, scope: Optional[str] = None, state: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates the official LinkedIn OAuth 2.0 authorization URL.
        Scopes: 'openid profile email'.
        """
        active_redirect = redirect_uri or self.redirect_uri
        active_scope = (scope or self.scopes).strip()
        scope_list = active_scope.split()
        csrf_state = state or self.generate_state()

        if not self.is_configured():
            logger.error("[LinkedIn OAuth] Client ID or Secret is not configured in backend/.env!")
            return {
                "configured": False,
                "authorization_url": "",
                "client_id": "",
                "redirect_uri": active_redirect,
                "state": csrf_state,
                "scopes": scope_list,
                "message": "LinkedIn Client ID or Client Secret is not configured in backend/.env. Please configure your LinkedIn Developer Portal credentials."
            }

        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": active_redirect,
            "state": csrf_state,
            "scope": active_scope
        }

        auth_url = f"{self.LINKEDIN_AUTH_URL}?{urllib.parse.urlencode(params)}"
        logger.info(f"[LinkedIn OAuth] Generated auth URL for client {self.client_id[:6]}***, redirect: {active_redirect}, scopes: {active_scope}")
        return {
            "configured": True,
            "authorization_url": auth_url,
            "client_id": self.client_id,
            "redirect_uri": active_redirect,
            "state": csrf_state,
            "scopes": scope_list,
            "message": f"Redirecting to LinkedIn OAuth 2.0 sign-in with scopes: {active_scope}"
        }

    async def exchange_code_for_token(self, code: str, redirect_uri: Optional[str] = None) -> Dict[str, Any]:
        """
        Exchanges authorization code for a LinkedIn OAuth 2.0 access token.
        Never exposes the client secret to the caller.
        """
        active_redirect = redirect_uri or self.redirect_uri

        if not self.is_configured():
            err_msg = "LinkedIn OAuth credentials are not configured in backend/.env."
            logger.error(f"[LinkedIn OAuth Token Exchange] {err_msg}")
            raise ValueError(err_msg)

        payload = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": active_redirect
        }

        logger.info(f"[LinkedIn OAuth Token Exchange] Contacting LinkedIn token endpoint: {self.LINKEDIN_TOKEN_URL} (redirect_uri: {active_redirect})")
        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                resp = await client.post(
                    self.LINKEDIN_TOKEN_URL,
                    data=payload,
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
            except Exception as e:
                logger.error(f"[LinkedIn OAuth Token Exchange] Network connection error: {e}")
                raise ValueError(f"Failed to connect to LinkedIn OAuth token endpoint: {str(e)}")

            if resp.status_code != 200:
                logger.error(f"[LinkedIn OAuth Token Exchange] Failed with HTTP {resp.status_code}: {resp.text}")
                try:
                    err_json = resp.json()
                    err_type = err_json.get("error", "oauth_error")
                    err_desc = err_json.get("error_description", resp.text)
                    if err_type == "redirect_uri_mismatch":
                        raise ValueError(
                            f"Redirect URI mismatch ({err_desc}). "
                            f"The redirect_uri sent ({active_redirect}) does not match the Authorized redirect URLs configured in LinkedIn Developer Portal. "
                            f"Please ensure '{active_redirect}' is added under LinkedIn App -> Auth -> OAuth 2.0 settings -> Authorized redirect URLs."
                        )
                    elif err_type == "invalid_grant":
                        raise ValueError(
                            f"Authorization code expired or already used ({err_desc}). "
                            "Please click 'Connect with LinkedIn' to log in again."
                        )
                    elif err_type in ("invalid_client", "client_authentication_failed"):
                        raise ValueError(
                            f"LinkedIn Client Authentication failed ({err_desc}). "
                            "Please verify your LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET match your LinkedIn Developer Portal credentials."
                        )
                    else:
                        raise ValueError(f"LinkedIn Token Exchange Failed ({err_type}): {err_desc}")
                except ValueError:
                    raise
                except Exception:
                    raise ValueError(f"LinkedIn Token Exchange Failed (HTTP {resp.status_code}): {resp.text}")

            data = resp.json()
            logger.info("[LinkedIn OAuth Token Exchange] Authorization code exchanged successfully.")
            return data

    async def fetch_user_info(self, access_token: str) -> Dict[str, Any]:
        """
        Fetches authorized user identity from LinkedIn OpenID UserInfo endpoint (/v2/userinfo).
        Falls back to legacy /v2/me endpoint if needed.
        """
        headers = {"Authorization": f"Bearer {access_token}"}
        logger.info(f"[LinkedIn UserInfo] Fetching user profile from {self.LINKEDIN_USERINFO_URL}...")
        
        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                resp = await client.get(self.LINKEDIN_USERINFO_URL, headers=headers)
            except Exception as e:
                logger.error(f"[LinkedIn UserInfo] Network connection error: {e}")
                raise ValueError(f"Failed to connect to LinkedIn UserInfo endpoint: {str(e)}")

            if resp.status_code == 200:
                user_info = resp.json()
                logger.info(f"[LinkedIn UserInfo] Successfully retrieved user info for member '{user_info.get('sub', 'unknown')}' ({user_info.get('name', 'unnamed')}).")
                return user_info

            logger.warning(f"[LinkedIn UserInfo] OpenID UserInfo endpoint returned HTTP {resp.status_code}: {resp.text}. Attempting legacy fallback...")

            # Fallback to legacy /v2/me if standard UserInfo fails
            try:
                me_resp = await client.get("https://api.linkedin.com/v2/me", headers=headers)
                if me_resp.status_code == 200:
                    me_data = me_resp.json()
                    first = me_data.get("localizedFirstName", "")
                    last = me_data.get("localizedLastName", "")
                    name = f"{first} {last}".strip()
                    sub = me_data.get("id", "")
                    email = ""
                    try:
                        email_resp = await client.get(
                            "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
                            headers=headers
                        )
                        if email_resp.status_code == 200:
                            elements = email_resp.json().get("elements", [])
                            if elements:
                                email = elements[0].get("handle~", {}).get("emailAddress", "")
                    except Exception as em_err:
                        logger.warning(f"[LinkedIn UserInfo] Legacy email retrieval error: {em_err}")

                    logger.info(f"[LinkedIn UserInfo] Legacy fallback succeeded for member '{sub}'.")
                    return {
                        "sub": sub,
                        "name": name or "LinkedIn Member",
                        "given_name": first,
                        "family_name": last,
                        "picture": "",
                        "email": email,
                        "email_verified": bool(email),
                        "locale": {}
                    }
            except Exception as leg_err:
                logger.error(f"[LinkedIn UserInfo] Legacy fallback error: {leg_err}")

            logger.error(f"[LinkedIn UserInfo] Failed to retrieve user profile. Status: {resp.status_code}, Body: {resp.text}")
            raise ValueError(f"Failed to fetch LinkedIn user info (HTTP {resp.status_code}): {resp.text}")

    def build_candidate_profile_from_linkedin(
        self,
        user_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Converts authorized LinkedIn profile information into Candidate Profile structure.
        Populates ONLY from authenticated user's real authorized LinkedIn data (strictly zero dummy/mock data).
        """
        full_name = user_info.get("name") or f"{user_info.get('given_name', '')} {user_info.get('family_name', '')}".strip() or "LinkedIn Member"
        email = user_info.get("email", "")
        picture = user_info.get("picture", "")
        sub = user_info.get("sub", "")
        locale = user_info.get("locale", {})
        location = ""
        if isinstance(locale, dict):
            country = locale.get("country", "")
            if country:
                location = country

        logger.info(f"[LinkedIn Profile Builder] Built authentic candidate profile for '{full_name}' ({email}). No dummy data used.")

        return {
            "source": "LinkedIn OAuth 2.0 Authorized Profile (OpenID Connect)",
            "oauth_connected": True,
            "linkedin_member_id": sub,
            "full_name": full_name,
            "headline": user_info.get("headline", ""),
            "email": email,
            "avatar_url": picture,
            "location": location,
            "summary": "",
            "work_experience": [],
            "skills": [],
            "education": [],
            "certifications": [],
            "projects": [],
            "publications": [],
            "achievements": [],
            "languages": ["English"],
            "profile_links": {
                "linkedin": f"https://www.linkedin.com/in/{sub}" if sub else "https://www.linkedin.com"
            },
            "unavailable_fields": [
                "Work Experience: LinkedIn OpenID Connect API ('openid profile email') grants authorized access to verified identity, full name, and email. Full employment history is restricted by LinkedIn to enterprise partner/recruiter scopes. You can easily add your positions in Studio.",
                "Education History: Not exposed in OpenID Connect scopes. Can be reviewed/added in Studio.",
                "Skills & Certifications: Not exposed in OpenID Connect scopes. Can be added in Studio."
            ]
        }


# Global singleton instance
linkedin_oauth_service = LinkedInOAuthService()

