"""
Subscription & Payment Manager
==============================
Modular billing architecture supporting Free & Pro tier management,
mock and pluggable payment providers (Stripe/PayPal), checkout sessions,
and backend feature gating.
"""

import time
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from models.auth_schemas import PlanFeatures, SubscriptionInfo, UpgradeSubscriptionRequest, CheckoutSessionResponse
from auth_manager import auth_manager


class PaymentProvider(ABC):
    """Abstract interface for payment gateway providers."""

    @abstractmethod
    def create_checkout_session(self, user_email: str, plan: str, billing_cycle: str) -> CheckoutSessionResponse:
        ...

    @abstractmethod
    def cancel_subscription(self, user_email: str) -> bool:
        ...


class MockPaymentProvider(PaymentProvider):
    """Simulates real payment gateway transactions with instant activation."""

    def create_checkout_session(self, user_email: str, plan: str, billing_cycle: str) -> CheckoutSessionResponse:
        session_id = f"cs_mock_{int(time.time())}_{user_email.replace('@', '_')}"
        return CheckoutSessionResponse(
            session_id=session_id,
            checkout_url=f"/checkout/{session_id}",
            status="ready",
            message="Mock checkout session initialized. Ready for payment confirmation."
        )

    def cancel_subscription(self, user_email: str) -> bool:
        return True


class SubscriptionManager:
    """Manages plans, feature definitions, and user subscriptions."""

    def __init__(self, payment_provider: Optional[PaymentProvider] = None):
        self.provider = payment_provider or MockPaymentProvider()
        self.user_subscriptions: Dict[str, SubscriptionInfo] = {
            "free@careerai.io": SubscriptionInfo(
                plan="free",
                status="active",
                current_period_end=None,
                cancel_at_period_end=False,
                payment_method=None
            ),
            "pro@careerai.io": SubscriptionInfo(
                plan="pro",
                status="active",
                current_period_end=(datetime.utcnow() + timedelta(days=30)).isoformat(),
                cancel_at_period_end=False,
                payment_method="Visa ending in 4242"
            ),
            "promax@careerai.io": SubscriptionInfo(
                plan="pro_max",
                status="active",
                current_period_end=(datetime.utcnow() + timedelta(days=30)).isoformat(),
                cancel_at_period_end=False,
                payment_method="Mastercard ending in 8899"
            )
        }

    def get_plans_catalog(self, current_user_plan: str = "free") -> List[PlanFeatures]:
        """Returns catalog of Free, Pro, and Pro Max plans with detailed feature breakdowns."""
        return [
            PlanFeatures(
                plan="free",
                name="Free Starter",
                description="Essential AI resume builder & diagnostic tools",
                price_monthly=0.0,
                price_yearly=0.0,
                badge=None,
                features=[
                    "Basic AI resume analysis & ATS score",
                    "Selection of Free ATS-friendly templates",
                    "Live dynamic resume preview",
                    "Basic AI writing assistance (5 rewrites)",
                    "Limited job matching (Top 3 searches)",
                    "Standard ATS layout audit",
                    "Ad-supported PDF download (5s rewarded ad)"
                ],
                is_current=(current_user_plan == "free")
            ),
            PlanFeatures(
                plan="pro",
                name="Pro Accelerator",
                description="Advanced AI optimization & 100+ premium templates",
                price_monthly=12.0,
                price_yearly=96.0,  # $8/mo billed annually ($96/yr)
                badge="Most Popular",
                features=[
                    "Advanced AI resume optimization & star scoring",
                    "100+ Premium categorized executive templates",
                    "Automatic 1-click template improvements application",
                    "More AI assistance & unlimited bullet rewrites",
                    "Better job matching & real-time gap analysis",
                    "AI Cover Letter generation with recruiter keywords",
                    "No ads & instant 1-click PDF/DOCX downloads"
                ],
                is_current=(current_user_plan == "pro")
            ),
            PlanFeatures(
                plan="pro_max",
                name="Pro Max / Career",
                description="The complete executive suite with live portfolio deployment",
                price_monthly=29.0,
                price_yearly=228.0,  # $19/mo billed annually ($228/yr)
                badge="All-Inclusive",
                features=[
                    "Everything in Pro",
                    "Exclusive 1-click Web Portfolio generation & live hosting",
                    "AI Job Application Agent with LinkedIn import & auto Studio review",
                    "Custom portfolio subdomains & theme customization",
                    "Dynamic web job search & multi-source matching",
                    "Advanced tailored cover letter generation per job role",
                    "More powerful AI career copilot & mock interview feedback",
                    "Priority server processing & high-speed LLM generation"
                ],
                is_current=(current_user_plan == "pro_max")
            )
        ]

    def get_user_subscription(self, email: str) -> SubscriptionInfo:
        email_clean = email.strip().lower()
        if email_clean not in self.user_subscriptions:
            user = auth_manager.get_user_by_email(email_clean)
            plan = user.plan if user else "free"
            self.user_subscriptions[email_clean] = SubscriptionInfo(
                plan=plan,
                status="active",
                current_period_end=(datetime.utcnow() + timedelta(days=30)).isoformat() if plan in ("pro", "pro_max") else None,
                cancel_at_period_end=False,
                payment_method="Visa ending in 4242" if plan in ("pro", "pro_max") else None
            )
        return self.user_subscriptions[email_clean]

    def upgrade_user_plan(self, email: str, plan: str = "pro", billing_cycle: str = "monthly") -> SubscriptionInfo:
        """Upgrades user plan to Pro or Pro Max immediately."""
        email_clean = email.strip().lower()
        days = 365 if billing_cycle == "yearly" else 30
        end_date = (datetime.utcnow() + timedelta(days=days)).isoformat()
        target_plan = "pro_max" if plan == "pro_max" else "pro"
        
        sub = SubscriptionInfo(
            plan=target_plan,
            status="active",
            current_period_end=end_date,
            cancel_at_period_end=False,
            payment_method=f"Mock Card ending in {8899 if target_plan == 'pro_max' else 4242}"
        )
        self.user_subscriptions[email_clean] = sub
        auth_manager.update_user_plan(email_clean, target_plan)
        return sub

    def upgrade_user_to_pro(self, email: str, billing_cycle: str = "monthly") -> SubscriptionInfo:
        """Legacy alias: upgrades user to Pro."""
        return self.upgrade_user_plan(email, "pro", billing_cycle)

    def cancel_user_subscription(self, email: str) -> SubscriptionInfo:
        """Schedules subscription cancellation at period end."""
        email_clean = email.strip().lower()
        sub = self.get_user_subscription(email_clean)
        sub.cancel_at_period_end = True
        return sub

    def verify_feature_access(self, user_plan: str, feature_name: str) -> bool:
        """Backend guard verifying if a plan is entitled to a feature."""
        # Pro Max exclusive features
        pro_max_only_features = {
            "portfolio_generation",
            "portfolio_deployment",
            "advanced_career_copilot",
            "advanced_job_search"
        }
        if feature_name in pro_max_only_features:
            return user_plan == "pro_max"

        # Pro and Pro Max features
        pro_features = {
            "premium_templates",
            "auto_apply_improvements",
            "unlimited_ai_rewrites",
            "instant_pdf_download_no_ads",
            "cover_letter_generation",
            "job_tailoring",
            "unlimited_job_searches",
            "multi_resume_save",
            "advanced_ats_audit"
        }
        if feature_name in pro_features:
            return user_plan in ("pro", "pro_max")

        # Free tier features
        return True


# Singleton instance
subscription_manager = SubscriptionManager()

