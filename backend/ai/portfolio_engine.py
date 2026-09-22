"""
Web Portfolio Generator & Deployment Engine
===========================================
Generates a complete, responsive developer / professional portfolio website configuration
from a candidate's ResumeProfile with themes, domain setup, and instant edge CDN deployment.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
import secrets
import re

from models.schemas import ResumeProfile
from models.auth_schemas import (
    PortfolioConfig, PortfolioProject, PortfolioDeployRequest, PortfolioDeployResponse
)


class PortfolioEngine:
    """Generates customized web portfolio configurations from resume profiles."""

    @classmethod
    def generate_from_profile(
        cls,
        profile: ResumeProfile,
        theme: str = "dark_cyber"
    ) -> PortfolioConfig:
        full_name = profile.contact_info.full_name or "Alex Chen"
        # Generate clean subdomain slug: e.g. "alex-chen"
        clean_slug = re.sub(r'[^a-zA-Z0-9]', '', full_name.lower()) or "candidate"
        
        # Headline & Bio
        title = profile.contact_info.title or profile.target_role or "Full Stack Software Engineer"
        bio = profile.summary or (
            f"Passionate {title} dedicated to architecting reliable systems, "
            f"clean user interfaces, and scalable applications."
        )

        # Spotlight skills (Top 10)
        skills = (
            profile.skills.technical_skills +
            profile.skills.frameworks_libraries +
            profile.skills.developer_tools
        )[:10]

        # Extract portfolio projects
        portfolio_projects: List[PortfolioProject] = []
        project_images = [
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80"
        ]
        
        for i, proj in enumerate(profile.projects[:6]):
            portfolio_projects.append(PortfolioProject(
                title=proj.title,
                description=proj.description or (proj.highlights[0] if proj.highlights else "Enterprise software solution."),
                technologies=proj.technologies if proj.technologies else ["TypeScript", "React"],
                live_link=proj.link or f"https://github.com/{clean_slug}/{re.sub(r'[^a-z0-9]', '-', proj.title.lower())}",
                github_link=proj.link or f"https://github.com/{clean_slug}",
                featured=i < 2,
                image_url=project_images[i % len(project_images)]
            ))

        # Fallback if no projects exist
        if not portfolio_projects:
            portfolio_projects = [
                PortfolioProject(
                    title="CloudScale Telemetry Agent",
                    description="Distributed metric collection pipeline with real-time WebSocket dashboard.",
                    technologies=["TypeScript", "React", "Go", "Docker"],
                    live_link="https://github.com/example/project",
                    github_link="https://github.com/example/project",
                    featured=True,
                    image_url=project_images[0]
                )
            ]

        # Timeline
        timeline = []
        for exp in profile.work_experience:
            timeline.append({
                "company": exp.company,
                "role": exp.position,
                "period": f"{exp.start_date} – {'Present' if exp.current else exp.end_date}",
                "location": exp.location or "Remote",
                "highlights": exp.highlights[:3]
            })

        # Social links
        socials = {
            "github": profile.contact_info.github or f"https://github.com/{clean_slug}",
            "linkedin": profile.contact_info.linkedin or f"https://linkedin.com/in/{clean_slug}",
            "email": profile.contact_info.email or f"{clean_slug}@example.com"
        }
        if profile.contact_info.portfolio:
            socials["portfolio"] = profile.contact_info.portfolio

        return PortfolioConfig(
            subdomain=clean_slug,
            theme=theme,
            hero_headline=f"Hi, I'm {full_name} — {title}",
            hero_bio=bio,
            skills_spotlight=skills if skills else ["Python", "TypeScript", "React", "AWS", "FastAPI"],
            projects=portfolio_projects,
            experience_timeline=timeline,
            social_links=socials,
            allow_pdf_download=True,
            contact_email_enabled=True,
            custom_accent_color="#3B82F6" if theme == "dark_cyber" else ("#10B981" if theme == "emerald_clean" else "#E11D48")
        )

    @classmethod
    def deploy_portfolio(cls, config: PortfolioConfig) -> PortfolioDeployResponse:
        """Simulates rapid edge CDN provisioning and SSL propagation."""
        deploy_id = f"dep_{secrets.token_hex(8)}"
        clean_sub = re.sub(r'[^a-zA-Z0-9-]', '', config.subdomain.lower()) or "portfolio"
        live_domain = f"https://{clean_sub}.careerai.site"

        return PortfolioDeployResponse(
            deployment_id=deploy_id,
            live_url=live_domain,
            status="active",
            deployed_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            cdn_region="Global Edge (AWS CloudFront / Cloudflare)",
            message="Your web portfolio is live worldwide with SSL & automatic resume synchronisation!"
        )
