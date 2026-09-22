"""
Truthful ATS Resume Analysis Engine
=====================================
Key principles:
- NEVER suggest fabricated metrics (28%, 5K+ users, etc.)
- Detect project title lines and skip them from bullet analysis
- Distinguish weak verbs from missing verbs — smart replacement
- Fairer impact scoring: metrics are a bonus, not a requirement
- Rich WeakBulletIssue output with structured weakness info
"""
import re
from typing import List, Dict, Any, Optional
from models.schemas import (
    ResumeProfile, ATSAnalysisResult, ScoreBreakdown, WeakBulletIssue,
    TemplateRecommendation, ReadabilityMetrics
)
from nlp.skill_database import (
    FLATTENED_ACTION_VERBS, WEAK_PHRASES, SKILL_CATEGORIES
)


# ---------------------------------------------------------------------------
# Smart verb replacement map — context-aware, not always "Engineered"
# ---------------------------------------------------------------------------
WEAK_VERB_REPLACEMENT = {
    "worked on":        "Developed",
    "helped with":      "Contributed to",
    "responsible for":  "Led",
    "involved in":      "Participated in and contributed to",
    "participated in":  "Actively contributed to",
    "assisted with":    "Supported the development of",
    "assisted":         "Collaborated on",
    "did":              "Executed",
    "made":             "Created",
    "handled":          "Managed",
    "was part of":      "Contributed to",
    "helped":           "Assisted in developing",
    "did work on":      "Implemented",
}

# Verb → better replacement based on surrounding context keywords
CONTEXT_VERB_MAP = {
    "ui": "Developed",
    "frontend": "Developed",
    "backend": "Implemented",
    "api": "Implemented",
    "design": "Designed",
    "database": "Engineered",
    "test": "Tested",
    "deploy": "Deployed",
    "automat": "Automated",
    "architect": "Architected",
    "analyz": "Analysed",
    "optim": "Optimised",
    "integrat": "Integrated",
    "configur": "Configured",
    "document": "Documented",
    "research": "Researched",
    "train": "Trained",
    "manage": "Managed",
    "built": "Built",
    "script": "Scripted",
    "debug": "Debugged",
}

# Project title line patterns — these are headings, not achievement bullets
PROJECT_TITLE_PATTERN = re.compile(
    r'^[A-Z][^\n]{3,60}\s*[\|\-–—]\s*[^\n]{3,}$|'   # "ProjectName | Tech Stack"
    r'^[A-Z][^\n]{3,60}\s*[,–\-]\s*(React|Django|Python|Node|Flutter|Next|Vue|Angular|Firebase|AWS|Go|Java|Spring|Express)',
    re.IGNORECASE
)

# Metric patterns (real numbers already in text)
METRICS_REGEX = re.compile(
    r'(\b\d+(\.\d+)?%|\$\s?\d+[\d,]*(\.\d+)?|\b\d+x\b|\b\d+[\d,]*\+?\s*'
    r'(users|clients|requests|ms|seconds|hours|days|teams|engineers|people|'
    r'dollars|revenue|growth|downloads|endpoints|features|bugs|tickets|stars|'
    r'sales|modules|actions|apis|functions|services|pages|queries|tests|'
    r'repos|commits|records|rows|tables|pipelines|jobs|tasks))\b',
    re.IGNORECASE
)


class ATSScorer:
    """
    Truthful ATS Compatibility & Quality Scoring Engine.

    Evaluates resume completeness, clarity, action verb strength,
    and weak phrases. Never suggests fabricated metrics.
    """

    @classmethod
    def analyze_resume(cls, profile: ResumeProfile) -> ATSAnalysisResult:

        # Collect bullets, separating project title lines from actual bullets
        all_bullets: List[str] = []
        for exp in profile.work_experience:
            all_bullets.extend(exp.highlights)
        for proj in profile.projects:
            # Project title is usually proj.title / proj.description, not highlights
            # But some parsers dump the title line into highlights[0]
            for h in proj.highlights:
                all_bullets.append(h)

        # ── 1. Section Completeness (0–100) ──────────────────────────────────
        missing_sections: List[str] = []
        completeness_pts = 0

        # Contact (20 pts)
        if profile.contact_info.full_name:     completeness_pts += 5
        if profile.contact_info.email:         completeness_pts += 5
        if profile.contact_info.phone:         completeness_pts += 4
        if (profile.contact_info.linkedin or
                profile.contact_info.github or
                profile.contact_info.portfolio): completeness_pts += 6
        if not (profile.contact_info.email and profile.contact_info.phone):
            missing_sections.append("Full Contact Information (Email & Phone)")

        # Summary (15 pts)
        if profile.summary and len(profile.summary.split()) >= 20:
            completeness_pts += 15
        elif profile.summary:
            completeness_pts += 8
        else:
            missing_sections.append("Professional Summary")

        # Experience / Projects (30 pts)
        if profile.work_experience and len(profile.work_experience) >= 2:
            completeness_pts += 30
        elif profile.work_experience or profile.projects:
            completeness_pts += 20
        else:
            missing_sections.append("Work Experience / Projects")

        # Education (20 pts)
        if profile.education:
            completeness_pts += 20
        else:
            missing_sections.append("Education Section")

        # Skills (15 pts)
        total_skills_count = (
            len(profile.skills.technical_skills) +
            len(profile.skills.frameworks_libraries) +
            len(profile.skills.developer_tools) +
            len(profile.skills.soft_skills) +
            len(profile.skills.other)
        )
        if total_skills_count >= 8:
            completeness_pts += 15
        elif total_skills_count >= 4:
            completeness_pts += 10
        else:
            missing_sections.append("Comprehensive Skills Section")

        completeness_score = min(100.0, float(completeness_pts))

        # ── 2. Bullet Quality Analysis ────────────────────────────────────────
        quantified_bullets = 0
        strong_verb_bullets = 0
        weak_phrase_count = 0
        weak_bullets: List[WeakBulletIssue] = []
        real_bullets: List[str] = []  # non-title bullets only

        for bullet in all_bullets:
            raw = bullet.strip()
            b_lower = raw.lower()

            # ── Project title detection ──
            if cls._is_project_title(raw):
                weak_bullets.append(WeakBulletIssue(
                    original_text=raw,
                    issue_type="project_title",
                    weakness_label="Project heading — not an achievement bullet",
                    reason="This line looks like a project title or tech-stack heading, not a bullet describing what you accomplished.",
                    suggested_fix="",
                    polished_text="",
                    metric_opportunity=False,
                    metric_prompt="",
                    is_project_title=True
                ))
                continue  # don't count title lines in scoring

            real_bullets.append(raw)

            # ── Metric check ──
            has_metric = bool(METRICS_REGEX.search(raw) or
                              re.search(r'\b\d{2,}\b', raw))  # any 2+ digit number
            if has_metric:
                quantified_bullets += 1

            # ── Action verb check ──
            words = b_lower.split()
            first_word = re.sub(r'[^a-z]', '', words[0]) if words else ""
            has_strong_verb = first_word in FLATTENED_ACTION_VERBS
            if has_strong_verb:
                strong_verb_bullets += 1

            # ── Weak phrase check ──
            found_weak_phrase: Optional[str] = None
            for wp in WEAK_PHRASES:
                if wp in b_lower:
                    found_weak_phrase = wp
                    weak_phrase_count += 1
                    break

            # ── Build WeakBulletIssue ──
            if found_weak_phrase:
                replacement = cls._suggest_verb_replacement(found_weak_phrase, raw)
                polished = cls._polish_bullet(raw, replacement)
                weak_bullets.append(WeakBulletIssue(
                    original_text=raw,
                    issue_type="vague_verb",
                    weakness_label="Vague or passive phrasing",
                    reason=(
                        f'The phrase "{found_weak_phrase}" is passive and vague. '
                        f"It doesn't clearly convey your direct contribution."
                    ),
                    suggested_fix=polished,
                    polished_text=polished,
                    metric_opportunity=not has_metric,
                    metric_prompt=cls._metric_prompt(raw) if not has_metric else "",
                ))

            elif not has_strong_verb and len(raw.split()) > 4:
                polished = cls._polish_bullet(raw, cls._infer_best_verb(raw))
                weak_bullets.append(WeakBulletIssue(
                    original_text=raw,
                    issue_type="passive_voice",
                    weakness_label="Missing action verb",
                    reason=(
                        "This bullet does not start with a strong action verb, which makes "
                        "it harder for ATS systems and recruiters to parse your contribution."
                    ),
                    suggested_fix=polished,
                    polished_text=polished,
                    metric_opportunity=not has_metric,
                    metric_prompt=cls._metric_prompt(raw) if not has_metric else "",
                ))

            elif not has_metric and len(raw.split()) > 8:
                # Good verb, good length — only mention metric as optional opportunity
                weak_bullets.append(WeakBulletIssue(
                    original_text=raw,
                    issue_type="missing_metrics",
                    weakness_label="Limited measurable impact",
                    reason=(
                        "The bullet explains what was built but doesn't mention its scale or outcome. "
                        "This is fine for early-career roles, but adding real numbers when available "
                        "makes it stronger."
                    ),
                    suggested_fix=raw,   # don't change anything — bullet is factually fine
                    polished_text=raw,
                    metric_opportunity=True,
                    metric_prompt=cls._metric_prompt(raw),
                ))

            elif len(raw.split()) < 5:
                polished = cls._polish_bullet(raw, cls._infer_best_verb(raw))
                weak_bullets.append(WeakBulletIssue(
                    original_text=raw,
                    issue_type="too_short",
                    weakness_label="Too brief",
                    reason=(
                        "This bullet is very short and doesn't provide enough context "
                        "about what you did, how you did it, or the result."
                    ),
                    suggested_fix=polished,
                    polished_text=polished,
                    metric_opportunity=not has_metric,
                    metric_prompt=cls._metric_prompt(raw) if not has_metric else "",
                ))

        total_real = len(real_bullets)

        # ── 3. Scoring ────────────────────────────────────────────────────────

        # Impact score: metrics are a BONUS not a requirement
        # Base = 50 for having bullets; each quantified bullet adds up to 50 pts
        if total_real > 0:
            quant_ratio = quantified_bullets / total_real
            # Generous curve: 50% quantified = 80 pts, 100% = 100 pts
            impact_score = min(100.0, 50.0 + quant_ratio * 50.0)
            verb_ratio = strong_verb_bullets / total_real
            action_verb_score = min(100.0, verb_ratio * 120.0)
        elif not all_bullets:
            impact_score = 30.0
            action_verb_score = 30.0
        else:
            # Only project titles — partial credit
            impact_score = 40.0
            action_verb_score = 40.0

        # Formatting score
        total_words = len(" ".join([
            profile.summary or "",
            " ".join(all_bullets),
            " ".join(profile.achievements)
        ]).split())

        formatting_score = 90.0
        if total_words < 150:   formatting_score -= 30.0
        elif total_words > 800: formatting_score -= 15.0
        if weak_phrase_count > 3: formatting_score -= 10.0

        # Skills depth
        skills_depth = min(100.0, total_skills_count * 7.5)

        # Weighted overall — impact down from 25% to 20%, completeness up to 35%
        overall = (
            completeness_score  * 0.35 +
            impact_score        * 0.20 +
            action_verb_score   * 0.20 +
            skills_depth        * 0.15 +
            formatting_score    * 0.10
        )
        overall_int = max(10, min(100, int(round(overall))))

        # Grade
        if overall_int >= 90:   grade = "A+"
        elif overall_int >= 80: grade = "A"
        elif overall_int >= 70: grade = "B"
        elif overall_int >= 55: grade = "C"
        else:                   grade = "Needs Work"

        # ── 4. Actionable Suggestions ─────────────────────────────────────────
        suggestions = []

        if completeness_score < 85 and missing_sections:
            suggestions.append({
                "priority": "High",
                "category": "Structure",
                "title": "Complete Missing Core Sections",
                "description": (
                    f"Add missing sections: {', '.join(missing_sections)} so that "
                    f"ATS parsers can fully index your background."
                )
            })

        vague_verb_count = sum(1 for w in weak_bullets if w.issue_type == "vague_verb")
        if vague_verb_count > 0:
            suggestions.append({
                "priority": "High",
                "category": "Language",
                "title": f"Replace {vague_verb_count} Passive/Vague Phrase(s)",
                "description": (
                    f"Phrases like 'responsible for', 'worked on', or 'helped with' "
                    f"weaken your resume. Use direct action verbs that show what YOU did."
                )
            })

        passive_count = sum(1 for w in weak_bullets if w.issue_type == "passive_voice")
        if passive_count > 0:
            suggestions.append({
                "priority": "Medium",
                "category": "Language",
                "title": f"Add Action Verbs to {passive_count} Bullet(s)",
                "description": (
                    "Start each bullet with a strong past-tense action verb "
                    "(Designed, Implemented, Built, Automated, etc.) that accurately "
                    "reflects your direct contribution."
                )
            })

        metric_opps = sum(1 for w in weak_bullets if w.metric_opportunity and w.issue_type == "missing_metrics")
        if metric_opps > 0:
            suggestions.append({
                "priority": "Low" if total_real < 5 else "Medium",
                "category": "Impact",
                "title": f"Add Real Metrics to {metric_opps} Bullet(s) — If Available",
                "description": (
                    "Where you have actual numbers (users, APIs, modules, time saved, etc.), "
                    "add them. Never invent metrics — only use real information you can verify."
                )
            })

        if total_skills_count < 10:
            suggestions.append({
                "priority": "Low",
                "category": "Keywords",
                "title": "Expand Core Technical Skills",
                "description": (
                    "List relevant frameworks, databases, and tools to improve "
                    "ATS keyword matching for job descriptions you target."
                )
            })

        # Skills map
        identified_skills_dict = {
            "Programming Languages": profile.skills.technical_skills,
            "Frameworks & Libraries": profile.skills.frameworks_libraries,
            "Developer Tools & Cloud": profile.skills.developer_tools,
            "Soft Skills": profile.skills.soft_skills,
            "Other Keywords": profile.skills.other
        }

        score_explanation = (
            f"Score {overall_int}/100: "
            f"Completeness {int(completeness_score)}% · "
            f"Clarity & Verbs {int(action_verb_score)}% · "
            f"Measurable Impact {int(impact_score)}% · "
            f"Skills Depth {int(skills_depth)}% · "
            f"Formatting {int(formatting_score)}%. "
            f"Impact score is a bonus dimension — early-career resumes without numbers "
            f"are not unfairly penalised."
        )

        breakdown = ScoreBreakdown(
            completeness_score=int(round(completeness_score)),
            impact_score=int(round(impact_score)),
            action_verb_score=int(round(action_verb_score)),
            formatting_score=int(round(formatting_score)),
            skills_depth_score=int(round(skills_depth)),
            overall_score=int(round(overall))
        )

        # Compute Readability Metrics
        avg_sentence_len = round(total_words / max(len(all_bullets), 1), 1)
        flesch_score = max(20.0, min(95.0, round(206.835 - (1.015 * avg_sentence_len) - (84.6 * 1.45), 1)))
        
        if flesch_score >= 70:
            reading_level = "Easy to Scan / Recruiter Friendly"
        elif flesch_score >= 50:
            reading_level = "Professional / Standard Density"
        else:
            reading_level = "High Density / Academic Complexity"

        density_grade = "Optimal"
        if avg_sentence_len > 26:
            density_grade = "Too Dense"
        elif avg_sentence_len < 10:
            density_grade = "Too Sparse"

        readability = ReadabilityMetrics(
            flesch_reading_ease=flesch_score,
            reading_level=reading_level,
            avg_sentence_length=avg_sentence_len,
            estimated_read_time_seconds=max(20, int(total_words / 3.8)),
            formatting_density=density_grade,
            bullet_length_grade="Good" if 12 <= avg_sentence_len <= 24 else ("Needs Condensing" if avg_sentence_len > 24 else "Needs Expansion")
        )

        # Generate Smart Template Recommendations based on profile domain, weaknesses & density
        recommended_templates = cls._generate_template_recommendations(profile, formatting_score, total_words, avg_sentence_len)

        return ATSAnalysisResult(
            overall_score=overall_int,
            grade=grade,
            score_breakdown=breakdown,
            total_words=total_words,
            bullet_count=len(all_bullets),
            quantified_bullet_count=quantified_bullets,
            action_verb_count=strong_verb_bullets,
            weak_phrases_count=weak_phrase_count,
            missing_sections=missing_sections,
            identified_skills=identified_skills_dict,
            weak_bullets=weak_bullets[:10],
            actionable_suggestions=suggestions,
            score_explanation=score_explanation,
            recommended_templates=recommended_templates,
            readability_metrics=readability
        )

    @classmethod
    def _generate_template_recommendations(
        cls,
        profile: ResumeProfile,
        formatting_score: float,
        total_words: int,
        avg_sentence_len: float
    ) -> List[TemplateRecommendation]:
        """Dynamically identifies top 3-4 optimal templates with tailored diagnostic rationale."""
        target_role_lower = (profile.target_role or profile.contact_info.title or "").lower()
        has_tech_skills = len(profile.skills.technical_skills) + len(profile.skills.frameworks_libraries) >= 4
        is_exec_or_lead = any(w in target_role_lower for w in ["lead", "manager", "director", "head", "principal", "architect", "vp", "chief"])
        is_creative_or_design = any(w in target_role_lower for w in ["designer", "ui", "ux", "product design", "creative", "artist", "marketing"])
        is_student_or_entry = any(w in target_role_lower for w in ["intern", "graduate", "junior", "student", "entry"]) or len(profile.work_experience) <= 1

        recommendations: List[TemplateRecommendation] = []

        if is_exec_or_lead:
            recommendations.append(TemplateRecommendation(
                template_id="prof_summit",
                name="Summit Global Executive",
                category="Professional",
                is_pro=True,
                thumbnail_color="#0D9488",
                secondary_color="#115E59",
                font_family="Inter",
                layout_type="two_column",
                match_score=98,
                match_reason="Elevates senior leadership milestones with prominent competency callouts and dual-column balance.",
                estimated_score_boost=18,
                preview_tag="Executive Choice"
            ))
            recommendations.append(TemplateRecommendation(
                template_id="prof_corporate",
                name="Corporate Standard",
                category="Professional",
                is_pro=False,
                thumbnail_color="#2563EB",
                secondary_color="#1E293B",
                font_family="Inter",
                layout_type="single_column",
                match_score=94,
                match_reason="Single-column enterprise hierarchy preferred by Fortune 500 ATS screening filters.",
                estimated_score_boost=12,
                preview_tag="ATS Enterprise Free"
            ))
            recommendations.append(TemplateRecommendation(
                template_id="minimal_clean",
                name="Minimal Pure",
                category="Minimal",
                is_pro=False,
                thumbnail_color="#0F172A",
                secondary_color="#475569",
                font_family="Inter",
                layout_type="single_column",
                match_score=90,
                match_reason="Zero visual clutter with generous white space for fast executive scanning.",
                estimated_score_boost=10,
                preview_tag="High Whitespace Free"
            ))
            recommendations.append(TemplateRecommendation(
                template_id="prof_consulting",
                name="McKinsey Advisory",
                category="Professional",
                is_pro=True,
                thumbnail_color="#1E3A8A",
                secondary_color="#1E293B",
                font_family="Merriweather",
                layout_type="single_column",
                match_score=92,
                match_reason="High-density serif typography emphasizing strategic business ROI.",
                estimated_score_boost=15,
                preview_tag="Strategy Pro"
            ))
        elif is_creative_or_design:
            recommendations.append(TemplateRecommendation(
                template_id="modern_prism",
                name="Prism Creative Gradient",
                category="Creative",
                is_pro=True,
                thumbnail_color="#E11D48",
                secondary_color="#4C0519",
                font_family="Outfit",
                layout_type="two_column",
                match_score=97,
                match_reason="Visual showcase layout with badge-styled skill tags and stylish modern accent.",
                estimated_score_boost=16,
                preview_tag="Design Spotlight Pro"
            ))
            recommendations.append(TemplateRecommendation(
                template_id="modern_aurora",
                name="Aurora Modern",
                category="Modern",
                is_pro=False,
                thumbnail_color="#2563EB",
                secondary_color="#1E293B",
                font_family="Inter",
                layout_type="two_column",
                match_score=92,
                match_reason="Sleek dual-column sidebar with crisp color accents for creative technocrats.",
                estimated_score_boost=12,
                preview_tag="Modern Free"
            ))
            recommendations.append(TemplateRecommendation(
                template_id="minimal_nordic",
                name="Nordic Studio",
                category="Minimal",
                is_pro=True,
                thumbnail_color="#334155",
                secondary_color="#64748B",
                font_family="Plus Jakarta",
                layout_type="single_column",
                match_score=89,
                match_reason="Airy Scandinavian typographic balance with fine hairline dividers.",
                estimated_score_boost=11,
                preview_tag="Minimalist Pro"
            ))
        elif has_tech_skills or "engineer" in target_role_lower or "developer" in target_role_lower:
            recommendations.append(TemplateRecommendation(
                template_id="modern_nexus",
                name="Nexus Tech Architect",
                category="Modern",
                is_pro=True,
                thumbnail_color="#0284C7",
                secondary_color="#0C4A6E",
                font_family="Plus Jakarta",
                layout_type="two_column",
                match_score=99,
                match_reason="Dual-column layout separates tech stack & tools from core project achievements.",
                estimated_score_boost=18,
                preview_tag="Software Engineer Top Pick Pro"
            ))
            recommendations.append(TemplateRecommendation(
                template_id="modern_aurora",
                name="Aurora Modern",
                category="Modern",
                is_pro=False,
                thumbnail_color="#2563EB",
                secondary_color="#1E293B",
                font_family="Inter",
                layout_type="two_column",
                match_score=95,
                match_reason="Clean two-column sidebar format that keeps developer tools readable in under 6 seconds.",
                estimated_score_boost=14,
                preview_tag="Best Free Developer Template"
            ))
            recommendations.append(TemplateRecommendation(
                template_id="minimal_clean",
                name="Minimal Pure ATS",
                category="Minimal",
                is_pro=False,
                thumbnail_color="#0F172A",
                secondary_color="#475569",
                font_family="Inter",
                layout_type="single_column",
                match_score=91,
                match_reason="Strict 100% ATS parser compatibility with clean single-column flow.",
                estimated_score_boost=12,
                preview_tag="ATS Verified Free"
            ))
            recommendations.append(TemplateRecommendation(
                template_id="modern_vertex",
                name="Vertex High-Growth",
                category="Modern",
                is_pro=True,
                thumbnail_color="#4F46E5",
                secondary_color="#1E1B4B",
                font_family="Plus Jakarta",
                layout_type="two_column",
                match_score=93,
                match_reason="Engineered for fast-paced tech startups and scaleup engineers.",
                estimated_score_boost=15,
                preview_tag="High Growth Pro"
            ))
        else:
            recommendations.append(TemplateRecommendation(
                template_id="modern_aurora",
                name="Aurora Modern",
                category="Modern",
                is_pro=False,
                thumbnail_color="#2563EB",
                secondary_color="#1E293B",
                font_family="Inter",
                layout_type="two_column",
                match_score=96,
                match_reason="Balanced layout that distributes education, skills, and experience cleanly.",
                estimated_score_boost=15,
                preview_tag="Recommended Free"
            ))
            recommendations.append(TemplateRecommendation(
                template_id="prof_corporate",
                name="Corporate Standard",
                category="Professional",
                is_pro=False,
                thumbnail_color="#2563EB",
                secondary_color="#1E293B",
                font_family="Inter",
                layout_type="single_column",
                match_score=93,
                match_reason="Classic single-column flow verified across Taleo, Workday, and Greenhouse ATS.",
                estimated_score_boost=12,
                preview_tag="ATS Classic Free"
            ))
            recommendations.append(TemplateRecommendation(
                template_id="modern_nexus",
                name="Nexus Prime",
                category="Modern",
                is_pro=True,
                thumbnail_color="#0284C7",
                secondary_color="#0C4A6E",
                font_family="Plus Jakarta",
                layout_type="two_column",
                match_score=94,
                match_reason="Structured modern visual appeal with distinct section contrast.",
                estimated_score_boost=16,
                preview_tag="Premium Choice"
            ))
            recommendations.append(TemplateRecommendation(
                template_id="classic_times",
                name="Classic Heritage",
                category="Classic",
                is_pro=False,
                thumbnail_color="#000000",
                secondary_color="#1F2937",
                font_family="Merriweather",
                layout_type="single_column",
                match_score=88,
                match_reason="Timeless serif style suited for traditional industries and academia.",
                estimated_score_boost=10,
                preview_tag="Traditional Free"
            ))

        return recommendations

    # ── Helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    def _is_project_title(text: str) -> bool:
        """Detect project title/heading lines that shouldn't be treated as bullets."""
        stripped = text.strip()
        # Pattern: "Name | Tech, Stack" or "Name - React, Firebase"
        if re.match(
            r'^[A-Za-z0-9][^\n]{2,60}\s*[\|\-–—]\s*(React|Vue|Angular|Django|FastAPI|'
            r'Flask|Node|Next\.?js|Python|Java|Go|Rust|Firebase|AWS|GCP|Azure|'
            r'MongoDB|PostgreSQL|MySQL|TailwindCSS|Bootstrap|Flutter|Kotlin|Swift)',
            stripped, re.IGNORECASE
        ):
            return True
        # Pattern: very short, title-cased, no verb
        words = stripped.split()
        if len(words) <= 5 and stripped[0].isupper() and "|" not in stripped:
            return False
        return False

    @staticmethod
    def _suggest_verb_replacement(weak_phrase: str, full_text: str) -> str:
        """Pick a contextually appropriate replacement for a weak phrase."""
        text_lower = full_text.lower()
        for keyword, verb in CONTEXT_VERB_MAP.items():
            if keyword in text_lower:
                return verb
        # Fallback from map
        return WEAK_VERB_REPLACEMENT.get(weak_phrase, "Developed")

    @staticmethod
    def _infer_best_verb(text: str) -> str:
        """Infer the most appropriate action verb from text content."""
        text_lower = text.lower()
        for keyword, verb in CONTEXT_VERB_MAP.items():
            if keyword in text_lower:
                return verb
        return "Developed"

    @staticmethod
    def _polish_bullet(text: str, verb: str) -> str:
        """
        Produce a factual polish of the bullet:
        - Apply the suggested verb
        - Fix capitalization and punctuation
        - Remove only weak preamble — never add metrics
        """
        stripped = text.strip().lstrip("•-* ")
        # Remove weak phrase preambles
        for phrase in WEAK_VERB_REPLACEMENT:
            pattern = re.compile(r'^' + re.escape(phrase) + r'\s+', re.IGNORECASE)
            if pattern.match(stripped):
                stripped = pattern.sub('', stripped)
                break
        # Capitalize first letter
        if stripped:
            stripped = stripped[0].upper() + stripped[1:]
        # If it doesn't start with action verb, prepend one
        first_word = re.sub(r'[^a-z]', '', stripped.split()[0].lower()) if stripped.split() else ""
        if first_word not in FLATTENED_ACTION_VERBS:
            stripped = f"{verb} {stripped[0].lower() + stripped[1:]}"
        # Ensure ends with period
        if stripped and not stripped.endswith('.'):
            stripped += '.'
        return stripped

    @staticmethod
    def _metric_prompt(text: str) -> str:
        """Generate a context-aware question asking for a REAL metric."""
        text_lower = text.lower()
        if any(k in text_lower for k in ["api", "endpoint", "service", "microservice"]):
            return "Do you know how many APIs, endpoints, or services this involved?"
        if any(k in text_lower for k in ["user", "customer", "client"]):
            return "Do you know approximately how many users or clients this affected?"
        if any(k in text_lower for k in ["module", "component", "feature"]):
            return "How many modules, components, or features did you implement?"
        if any(k in text_lower for k in ["test", "coverage", "bug", "defect"]):
            return "Do you know the test coverage percentage or number of defects resolved?"
        if any(k in text_lower for k in ["dataset", "record", "row", "data"]):
            return "Do you know the size of the dataset or number of records processed?"
        if any(k in text_lower for k in ["time", "speed", "latency", "performance"]):
            return "Do you have a performance improvement percentage or latency reduction figure?"
        if any(k in text_lower for k in ["team", "engineer", "developer", "member"]):
            return "How large was the team you collaborated with?"
        return "Do you have any supporting numbers — scale, count, improvement, or time saved?"
