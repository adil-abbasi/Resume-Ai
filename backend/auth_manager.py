"""
Authentication Manager
======================
Handles user registration, login, password hashing, token validation,
social sign-in (Google, GitHub), and password reset flows.
"""

import hashlib
import hmac
import secrets
import time
from datetime import datetime
from typing import Dict, Optional, Tuple, List
from models.auth_schemas import User, UserCreate, SocialAuthRequest

SECRET_KEY = "careerai-production-ats-resume-secret-key-2026"
TOKEN_EXPIRY_SECONDS = 86400 * 7  # 7 days


def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Hashes password with PBKDF2-HMAC-SHA256 and a random salt."""
    if salt is None:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    ).hex()
    return hashed, salt


def verify_password(password: str, hashed_password: str, salt: str) -> bool:
    """Verifies a plain password against the stored hash and salt."""
    new_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(new_hash, hashed_password)


def generate_token(user_id: str, email: str, plan: str) -> str:
    """Generates a secure signed token."""
    timestamp = int(time.time())
    payload = f"{user_id}:{email}:{plan}:{timestamp}"
    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return f"{payload}:{signature}"


def verify_token(token: str) -> Optional[Dict[str, str]]:
    """Verifies and decodes a signed token."""
    try:
        parts = token.split(":")
        if len(parts) != 5:
            return None
        user_id, email, plan, timestamp_str, signature = parts
        timestamp = int(timestamp_str)
        if time.time() - timestamp > TOKEN_EXPIRY_SECONDS:
            return None  # Expired
        
        expected_payload = f"{user_id}:{email}:{plan}:{timestamp_str}"
        expected_sig = hmac.new(
            SECRET_KEY.encode("utf-8"),
            expected_payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_sig, signature):
            return None
        
        return {"user_id": user_id, "email": email, "plan": plan}
    except Exception:
        return None


class AuthManager:
    """In-memory user and session database with persistent demo users."""

    def __init__(self):
        self.users: Dict[str, User] = {}
        self.user_passwords: Dict[str, Tuple[str, str]] = {}  # email -> (hash, salt)
        self.reset_tokens: Dict[str, Tuple[str, float]] = {}  # token -> (email, expiry)
        self._seed_default_users()

    def _seed_default_users(self):
        """Seeds initial demo accounts for instant testing."""
        # 1. Free Demo User
        free_pass, free_salt = hash_password("password123")
        free_user = User(
            id="user-demo-free",
            name="Free Candidate",
            email="free@careerai.io",
            plan="free",
            provider="local",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
            created_at=datetime.utcnow().isoformat(),
            resumes_count=1,
            ai_rewrites_used=2,
            favorite_templates=["modern", "ats_clean"]
        )
        self.users[free_user.email] = free_user
        self.user_passwords[free_user.email] = (free_pass, free_salt)

        # 2. Pro Demo User
        pro_pass, pro_salt = hash_password("password123")
        pro_user = User(
            id="user-demo-pro",
            name="Alex Chen (Pro)",
            email="pro@careerai.io",
            plan="pro",
            provider="local",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
            created_at=datetime.utcnow().isoformat(),
            resumes_count=4,
            ai_rewrites_used=42,
            favorite_templates=["executive_gold", "minimal_serif", "modern_cyan"]
        )
        self.users[pro_user.email] = pro_user
        self.user_passwords[pro_user.email] = (pro_pass, pro_salt)

        # 3. Pro Max Demo User
        promax_pass, promax_salt = hash_password("password123")
        promax_user = User(
            id="user-demo-promax",
            name="Sarah Jenkins (Pro Max)",
            email="promax@careerai.io",
            plan="pro_max",
            provider="local",
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
            created_at=datetime.utcnow().isoformat(),
            resumes_count=7,
            ai_rewrites_used=120,
            favorite_templates=["executive_gold", "minimal_serif", "emerald_executive"]
        )
        self.users[promax_user.email] = promax_user
        self.user_passwords[promax_user.email] = (promax_pass, promax_salt)

    def register_user(self, req: UserCreate) -> Tuple[Optional[User], Optional[str]]:
        """Registers a new user."""
        email_clean = req.email.strip().lower()
        if email_clean in self.users:
            return None, "An account with this email already exists."
        
        if req.password != (req.confirm_password or req.password):
            return None, "Passwords do not match."

        if len(req.password) < 6:
            return None, "Password must be at least 6 characters."

        user_id = f"user-{secrets.token_hex(6)}"
        hashed_pass, salt = hash_password(req.password)
        
        user = User(
            id=user_id,
            name=req.name.strip() or "Career Candidate",
            email=email_clean,
            plan="free",
            provider="local",
            created_at=datetime.utcnow().isoformat(),
            resumes_count=1,
            ai_rewrites_used=0,
            favorite_templates=["modern"]
        )

        self.users[email_clean] = user
        self.user_passwords[email_clean] = (hashed_pass, salt)
        return user, None

    def authenticate_user(self, email: str, password: str) -> Tuple[Optional[User], Optional[str]]:
        """Authenticates a user with email and password."""
        email_clean = email.strip().lower()
        user = self.users.get(email_clean)
        if not user:
            return None, "Invalid email or password."
        
        if email_clean not in self.user_passwords:
            return None, "This account uses social sign-in. Please sign in with Google or GitHub."
        
        hashed_pass, salt = self.user_passwords[email_clean]
        if not verify_password(password, hashed_pass, salt):
            return None, "Invalid email or password."

        return user, None

    def social_login(self, req: SocialAuthRequest) -> User:
        """Handles or creates a user account via Google / GitHub social sign-in."""
        email = (req.email or f"{req.provider}_user_{secrets.token_hex(4)}@auth.{req.provider}.com").lower()
        
        if email in self.users:
            user = self.users[email]
            if req.name and not user.name:
                user.name = req.name
            if req.avatar_url and not user.avatar_url:
                user.avatar_url = req.avatar_url
            return user

        # Create new user for social login
        user_id = f"user-{req.provider}-{secrets.token_hex(6)}"
        name = req.name or (f"Google User" if req.provider == "google" else "GitHub Developer")
        user = User(
            id=user_id,
            name=name,
            email=email,
            plan="free",
            provider=req.provider,
            avatar_url=req.avatar_url or (
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                if req.provider == "google" else
                "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80"
            ),
            created_at=datetime.utcnow().isoformat(),
            resumes_count=1,
            ai_rewrites_used=0,
            favorite_templates=["modern"]
        )
        self.users[email] = user
        return user

    def request_password_reset(self, email: str) -> Optional[str]:
        """Creates a password reset token for the given email."""
        email_clean = email.strip().lower()
        if email_clean not in self.users:
            return None
        
        token = secrets.token_urlsafe(32)
        expiry = time.time() + 3600  # 1 hour
        self.reset_tokens[token] = (email_clean, expiry)
        return token

    def reset_password(self, token: str, new_password: str) -> Tuple[bool, Optional[str]]:
        """Validates token and updates user password."""
        if token not in self.reset_tokens:
            return False, "Invalid or expired reset token."
        
        email, expiry = self.reset_tokens[token]
        if time.time() > expiry:
            del self.reset_tokens[token]
            return False, "Reset token has expired. Please request a new one."

        if len(new_password) < 6:
            return False, "Password must be at least 6 characters."

        hashed_pass, salt = hash_password(new_password)
        self.user_passwords[email] = (hashed_pass, salt)
        del self.reset_tokens[token]
        return True, None

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.users.get(email.strip().lower())

    def update_user_plan(self, email: str, new_plan: str) -> Optional[User]:
        email_clean = email.strip().lower()
        if email_clean in self.users:
            self.users[email_clean].plan = new_plan
            return self.users[email_clean]
        return None

    def toggle_favorite_template(self, email: str, template_id: str) -> List[str]:
        email_clean = email.strip().lower()
        user = self.users.get(email_clean)
        if not user:
            return []
        if template_id in user.favorite_templates:
            user.favorite_templates.remove(template_id)
        else:
            user.favorite_templates.append(template_id)
        return user.favorite_templates


# Singleton instance
auth_manager = AuthManager()
