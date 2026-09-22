"""
GitHub OAuth Service
====================
Handles the GitHub OAuth 2.0 flow for portfolio publishing.

Security principles:
- GitHub access tokens are NEVER returned to the browser frontend.
- All GitHub API calls (create repo, push files) are server-side only.
- Short-lived (30 min TTL) session tokens index into a server-side token store.
- CSRF state tokens are single-use with 15-minute TTL.

Setup:
  In backend/.env, add:
    GITHUB_CLIENT_ID=your_github_oauth_app_client_id
    GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret

Create a GitHub OAuth App at: https://github.com/settings/developers
  - Application name: Career AI Portfolio
  - Homepage URL: http://localhost:5173
  - Authorization callback URL: http://localhost:5173/api/auth/github/callback
"""
import os
import secrets
import logging
import time
from typing import Optional, Dict, Any, List

import httpx

logger = logging.getLogger("github_oauth")

# ─── In-memory stores ────────────────────────────────────────────────────────
# state_token -> { ts: float }
_CSRF_STATES: Dict[str, Dict[str, float]] = {}
# session_id -> { access_token, username, avatar_url, name, email, ts }
_GITHUB_SESSIONS: Dict[str, Dict[str, Any]] = {}

STATE_TTL = 900    # 15 min
SESSION_TTL = 1800 # 30 min
GITHUB_API_BASE = "https://api.github.com"


def _purge_expired() -> None:
    now = time.time()
    expired_states = [k for k, v in _CSRF_STATES.items() if now - v["ts"] > STATE_TTL]
    expired_sessions = [k for k, v in _GITHUB_SESSIONS.items() if now - v["ts"] > SESSION_TTL]
    for k in expired_states:
        del _CSRF_STATES[k]
    for k in expired_sessions:
        del _GITHUB_SESSIONS[k]


class GitHubOAuthService:
    """Manages the full GitHub OAuth 2.0 flow and repository publishing."""

    def __init__(self) -> None:
        self.client_id: str = os.getenv("GITHUB_CLIENT_ID", "")
        self.client_secret: str = os.getenv("GITHUB_CLIENT_SECRET", "")
        self.redirect_uri: str = os.getenv(
            "GITHUB_REDIRECT_URI",
            "http://localhost:5173/api/auth/github/callback"
        )

    @property
    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    def get_authorization_url(self) -> Dict[str, Any]:
        """Generate CSRF-protected GitHub OAuth authorization URL."""
        _purge_expired()
        if not self.is_configured:
            logger.warning("[GitHub OAuth] Not configured — missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET.")
            return {
                "configured": False,
                "authorization_url": "",
                "client_id": "",
                "redirect_uri": self.redirect_uri,
                "state": "",
                "scopes": ["repo", "user:email"],
                "message": (
                    "GitHub OAuth is not configured. "
                    "Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to backend/.env "
                    "and create an OAuth App at https://github.com/settings/developers "
                    "with callback URL: " + self.redirect_uri
                ),
            }

        state = secrets.token_urlsafe(24)
        _CSRF_STATES[state] = {"ts": time.time()}
        scopes = "repo,user:email"
        auth_url = (
            f"https://github.com/login/oauth/authorize"
            f"?client_id={self.client_id}"
            f"&redirect_uri={self.redirect_uri}"
            f"&scope={scopes}"
            f"&state={state}"
        )
        logger.info(f"[GitHub OAuth] Generated auth URL with state={state[:8]}...")
        return {
            "configured": True,
            "authorization_url": auth_url,
            "client_id": self.client_id[:6] + "***",
            "redirect_uri": self.redirect_uri,
            "state": state,
            "scopes": scopes.split(","),
            "message": "Ready — redirect user to authorization_url.",
        }

    def validate_state(self, state: Optional[str]) -> bool:
        """Validate and consume a CSRF state token (single-use)."""
        _purge_expired()
        if not state or state not in _CSRF_STATES:
            logger.warning(f"[GitHub OAuth] Invalid or missing state token: {str(state)[:16]}...")
            return False
        entry = _CSRF_STATES.pop(state)
        if time.time() - entry["ts"] > STATE_TTL:
            logger.warning(f"[GitHub OAuth] State token expired: {state[:8]}...")
            return False
        return True

    async def exchange_code_for_token(self, code: str) -> str:
        """Exchange authorization code for access token (server-side only)."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                json={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                },
            )
            if not resp.is_success:
                raise ValueError(f"GitHub token exchange failed: HTTP {resp.status_code}")
            data = resp.json()
            if "error" in data:
                raise ValueError(f"GitHub OAuth error: {data['error']} — {data.get('error_description', '')}")
            token = data.get("access_token", "")
            if not token:
                raise ValueError("No access_token returned from GitHub.")
            logger.info("[GitHub OAuth] Token exchanged successfully.")
            return token

    async def fetch_user_info(self, token: str) -> Dict[str, Any]:
        """Retrieve authenticated user info from GitHub API."""
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{GITHUB_API_BASE}/user", headers=headers)
            resp.raise_for_status()
            return resp.json()

    def store_session(self, access_token: str, user_info: Dict[str, Any]) -> str:
        """Store GitHub token server-side; return a short-lived session_id."""
        _purge_expired()
        session_id = secrets.token_urlsafe(24)
        _GITHUB_SESSIONS[session_id] = {
            "access_token": access_token,
            "username": user_info.get("login", ""),
            "name": user_info.get("name", ""),
            "avatar_url": user_info.get("avatar_url", ""),
            "email": user_info.get("email", ""),
            "ts": time.time(),
        }
        logger.info(f"[GitHub OAuth] Session stored: {session_id[:8]}... for user '{user_info.get('login', '')}'.")
        return session_id

    def get_session_public(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Return public user info (NO access token) for the given session."""
        _purge_expired()
        session = _GITHUB_SESSIONS.get(session_id)
        if not session:
            return None
        return {
            "username": session["username"],
            "name": session["name"],
            "avatar_url": session["avatar_url"],
            "email": session["email"],
        }

    def _get_token(self, session_id: str) -> Optional[str]:
        """Internal: retrieve raw access token for server-side API calls."""
        _purge_expired()
        session = _GITHUB_SESSIONS.get(session_id)
        return session["access_token"] if session else None

    async def list_user_repos(self, session_id: str) -> List[Dict[str, Any]]:
        """List the authenticated user's repositories (name + private flag)."""
        token = self._get_token(session_id)
        if not token:
            raise ValueError("GitHub session not found or expired.")
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{GITHUB_API_BASE}/user/repos",
                headers=headers,
                params={"sort": "updated", "per_page": 50, "type": "owner"},
            )
            resp.raise_for_status()
            repos = resp.json()
        return [
            {
                "name": r["name"],
                "full_name": r["full_name"],
                "private": r["private"],
                "html_url": r["html_url"],
                "description": r.get("description", ""),
                "updated_at": r.get("updated_at", ""),
            }
            for r in repos
        ]

    async def publish_portfolio(
        self,
        session_id: str,
        files: Dict[str, str],  # filename -> content
        repo_name: str,
        is_new_repo: bool = True,
        is_private: bool = False,
        description: str = "Personal portfolio generated by Career AI",
    ) -> Dict[str, Any]:
        """
        Create (or update) a GitHub repository and push portfolio files.

        Returns dict with: repo_url, html_url, pages_url, commit_sha.
        """
        token = self._get_token(session_id)
        if not token:
            raise ValueError("GitHub session not found or expired.")

        session = _GITHUB_SESSIONS.get(session_id, {})
        username = session.get("username", "")
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            # ── Step 1: Create or verify repo ──
            if is_new_repo:
                create_resp = await client.post(
                    f"{GITHUB_API_BASE}/user/repos",
                    headers=headers,
                    json={
                        "name": repo_name,
                        "description": description,
                        "private": is_private,
                        "auto_init": True,  # creates default branch with README
                    },
                )
                if create_resp.status_code not in (200, 201):
                    err = create_resp.json()
                    # Repo already exists
                    if create_resp.status_code == 422:
                        logger.warning(f"[GitHub Publish] Repo '{repo_name}' already exists — will update files.")
                    else:
                        raise ValueError(f"Failed to create repo '{repo_name}': {err.get('message', create_resp.text)}")
                repo_data = create_resp.json() if create_resp.status_code in (200, 201) else {}
            else:
                # Verify existing repo
                check = await client.get(f"{GITHUB_API_BASE}/repos/{username}/{repo_name}", headers=headers)
                if not check.is_success:
                    raise ValueError(f"Repository '{username}/{repo_name}' not found or no access.")
                repo_data = check.json()

            repo_full_name = repo_data.get("full_name", f"{username}/{repo_name}")
            default_branch = repo_data.get("default_branch", "main")

            # ── Step 2: Push each file ──
            import base64
            pushed = []
            for filename, content in files.items():
                encoded = base64.b64encode(content.encode("utf-8")).decode("ascii")
                # Check if file already exists (for update)
                get_file = await client.get(
                    f"{GITHUB_API_BASE}/repos/{repo_full_name}/contents/{filename}",
                    headers=headers,
                )
                sha: Optional[str] = None
                if get_file.is_success:
                    sha = get_file.json().get("sha")

                file_payload: Dict[str, Any] = {
                    "message": f"Update {filename} via Career AI Portfolio Studio",
                    "content": encoded,
                    "branch": default_branch,
                }
                if sha:
                    file_payload["sha"] = sha

                put_resp = await client.put(
                    f"{GITHUB_API_BASE}/repos/{repo_full_name}/contents/{filename}",
                    headers=headers,
                    json=file_payload,
                )
                if not put_resp.is_success:
                    err_data = put_resp.json()
                    raise ValueError(
                        f"Failed to push '{filename}': {err_data.get('message', put_resp.text)}"
                    )
                pushed.append(filename)
                logger.info(f"[GitHub Publish] Pushed {filename} to {repo_full_name}")

        html_url = repo_data.get("html_url", f"https://github.com/{repo_full_name}")
        pages_url = f"https://{username}.github.io/{repo_name}/"

        return {
            "repo_name": repo_name,
            "repo_full_name": repo_full_name,
            "html_url": html_url,
            "pages_url": pages_url,
            "pushed_files": pushed,
            "message": (
                f"Portfolio published to {html_url}. "
                f"Enable GitHub Pages in Settings → Pages to get: {pages_url}"
            ),
        }


# Singleton
github_oauth_service = GitHubOAuthService()
