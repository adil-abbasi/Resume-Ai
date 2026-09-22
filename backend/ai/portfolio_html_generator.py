"""
Portfolio HTML Generator
========================
Generates a complete, self-contained portfolio website (single HTML file)
from a PortfolioConfig. Supports 8 professional themes.

The output is truly standalone — no external JS frameworks, no build step.
External CSS is limited to Google Fonts (gracefully degrades without internet).
"""
from typing import Dict, Any
from io import BytesIO
import zipfile
import html
from models.auth_schemas import PortfolioConfig

# ─── Theme Definitions ────────────────────────────────────────────────────────

THEMES: Dict[str, Dict[str, str]] = {
    "dark_cyber": {
        "name": "Dark Cyber Neon",
        "bg": "#090D16",
        "bg_card": "#0F1623",
        "bg_nav": "rgba(9,13,22,0.92)",
        "text": "#E2E8F0",
        "text_muted": "#94A3B8",
        "accent": "#3B82F6",
        "accent_hover": "#60A5FA",
        "border": "#1E293B",
        "skill_bg": "#0F172A",
        "skill_border": "#334155",
        "font": "'Inter', 'Segoe UI', sans-serif",
        "heading_gradient": "linear-gradient(135deg, #3B82F6, #818CF8)",
        "hero_bg": "radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.12) 0%, transparent 60%)",
    },
    "emerald_clean": {
        "name": "Emerald Minimal",
        "bg": "#051510",
        "bg_card": "#0A1F18",
        "bg_nav": "rgba(5,21,16,0.92)",
        "text": "#ECFDF5",
        "text_muted": "#6EE7B7",
        "accent": "#10B981",
        "accent_hover": "#34D399",
        "border": "#134E3D",
        "skill_bg": "#071C15",
        "skill_border": "#065F46",
        "font": "'Inter', 'Segoe UI', sans-serif",
        "heading_gradient": "linear-gradient(135deg, #10B981, #34D399)",
        "hero_bg": "radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.12) 0%, transparent 60%)",
    },
    "obsidian_executive": {
        "name": "Obsidian Executive",
        "bg": "#0C0A08",
        "bg_card": "#161310",
        "bg_nav": "rgba(12,10,8,0.93)",
        "text": "#FEF3C7",
        "text_muted": "#92400E",
        "accent": "#D97706",
        "accent_hover": "#F59E0B",
        "border": "#2D2417",
        "skill_bg": "#110E0A",
        "skill_border": "#78350F",
        "font": "'Georgia', 'Times New Roman', serif",
        "heading_gradient": "linear-gradient(135deg, #D97706, #F59E0B)",
        "hero_bg": "radial-gradient(ellipse at 20% 50%, rgba(217,119,6,0.10) 0%, transparent 60%)",
    },
    "minimal_luxe": {
        "name": "Minimal Luxe",
        "bg": "#0B0710",
        "bg_card": "#130D1A",
        "bg_nav": "rgba(11,7,16,0.93)",
        "text": "#FECDD3",
        "text_muted": "#FDA4AF",
        "accent": "#E11D48",
        "accent_hover": "#FB7185",
        "border": "#2D1520",
        "skill_bg": "#0F0A14",
        "skill_border": "#9F1239",
        "font": "'Inter', 'Helvetica Neue', sans-serif",
        "heading_gradient": "linear-gradient(135deg, #E11D48, #FB7185)",
        "hero_bg": "radial-gradient(ellipse at 20% 50%, rgba(225,29,72,0.12) 0%, transparent 60%)",
    },
    "light_professional": {
        "name": "Light Professional",
        "bg": "#F8FAFC",
        "bg_card": "#FFFFFF",
        "bg_nav": "rgba(248,250,252,0.95)",
        "text": "#0F172A",
        "text_muted": "#475569",
        "accent": "#2563EB",
        "accent_hover": "#1D4ED8",
        "border": "#E2E8F0",
        "skill_bg": "#F1F5F9",
        "skill_border": "#CBD5E1",
        "font": "'Inter', 'Segoe UI', sans-serif",
        "heading_gradient": "linear-gradient(135deg, #2563EB, #7C3AED)",
        "hero_bg": "radial-gradient(ellipse at 20% 50%, rgba(37,99,235,0.06) 0%, transparent 60%)",
    },
    "dev_code": {
        "name": "Dev Terminal",
        "bg": "#0D1117",
        "bg_card": "#161B22",
        "bg_nav": "rgba(13,17,23,0.95)",
        "text": "#E6EDF3",
        "text_muted": "#7D8590",
        "accent": "#00FF41",
        "accent_hover": "#39FF5E",
        "border": "#30363D",
        "skill_bg": "#0D1117",
        "skill_border": "#21262D",
        "font": "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        "heading_gradient": "linear-gradient(135deg, #00FF41, #39FF5E)",
        "hero_bg": "radial-gradient(ellipse at 20% 50%, rgba(0,255,65,0.06) 0%, transparent 60%)",
    },
    "corporate_navy": {
        "name": "Corporate Navy",
        "bg": "#F0F4F8",
        "bg_card": "#FFFFFF",
        "bg_nav": "rgba(240,244,248,0.97)",
        "text": "#102A43",
        "text_muted": "#486581",
        "accent": "#1E3A5F",
        "accent_hover": "#243B6C",
        "border": "#BCCCDC",
        "skill_bg": "#E9EEF5",
        "skill_border": "#BCCCDC",
        "font": "'Inter', 'Segoe UI', Tahoma, sans-serif",
        "heading_gradient": "linear-gradient(135deg, #1E3A5F, #334E68)",
        "hero_bg": "radial-gradient(ellipse at 20% 50%, rgba(30,58,95,0.06) 0%, transparent 60%)",
    },
    "warm_creative": {
        "name": "Warm Creative",
        "bg": "#FFF8F0",
        "bg_card": "#FFFFFF",
        "bg_nav": "rgba(255,248,240,0.95)",
        "text": "#292524",
        "text_muted": "#78716C",
        "accent": "#EA580C",
        "accent_hover": "#F97316",
        "border": "#E7D5C0",
        "skill_bg": "#FEF3C7",
        "skill_border": "#F59E0B",
        "font": "'Inter', 'Georgia', sans-serif",
        "heading_gradient": "linear-gradient(135deg, #EA580C, #F97316)",
        "hero_bg": "radial-gradient(ellipse at 20% 50%, rgba(234,88,12,0.08) 0%, transparent 60%)",
    },
}

# ─── HTML Generator ───────────────────────────────────────────────────────────

def _e(text: str) -> str:
    """HTML-escape a string."""
    return html.escape(str(text or ""), quote=True)


def _skill_badges(skills: list, theme: Dict[str, str]) -> str:
    if not skills:
        return ""
    badges = "".join(
        f'<span class="skill-badge">{_e(s)}</span>'
        for s in skills
    )
    return f'<div class="skills-row">{badges}</div>'


def _project_cards(projects: list, theme: Dict[str, str]) -> str:
    if not projects:
        return '<p style="color:var(--text-muted)">No projects added yet.</p>'
    cards = []
    for proj in projects[:6]:
        techs = "".join(
            f'<span class="tech-badge">{_e(t)}</span>'
            for t in (proj.technologies if hasattr(proj, "technologies") else proj.get("technologies", []))[:4]
        )
        title = _e(proj.title if hasattr(proj, "title") else proj.get("title", ""))
        desc = _e((proj.description if hasattr(proj, "description") else proj.get("description", ""))[:220])
        live_link = (proj.live_link if hasattr(proj, "live_link") else proj.get("live_link")) or ""
        github_link = (proj.github_link if hasattr(proj, "github_link") else proj.get("github_link")) or ""
        links_html = ""
        if live_link:
            links_html += f'<a href="{_e(live_link)}" target="_blank" rel="noopener" class="proj-link">Live ↗</a>'
        if github_link:
            links_html += f'<a href="{_e(github_link)}" target="_blank" rel="noopener" class="proj-link">GitHub</a>'
        cards.append(f"""
      <div class="project-card">
        <div class="proj-header">
          <h3 class="proj-title">{title}</h3>
          <div class="proj-links">{links_html}</div>
        </div>
        <p class="proj-desc">{desc}</p>
        <div class="proj-techs">{techs}</div>
      </div>""")
    return "\n".join(cards)


def _experience_items(timeline: list) -> str:
    if not timeline:
        return '<p style="color:var(--text-muted)">No experience added yet.</p>'
    items = []
    for exp in timeline:
        role = _e(exp.get("role", exp.get("position", "")))
        company = _e(exp.get("company", ""))
        period = _e(exp.get("period", ""))
        location = _e(exp.get("location", ""))
        highlights = exp.get("highlights", [])
        bullets = "".join(f"<li>{_e(h)}</li>" for h in highlights[:3])
        items.append(f"""
      <div class="exp-item">
        <div class="exp-left">
          <div class="exp-period">{period}</div>
          {f'<div class="exp-location">{location}</div>' if location else ''}
        </div>
        <div class="exp-content">
          <div class="exp-role">{role}</div>
          <div class="exp-company">{company}</div>
          {f'<ul class="exp-bullets">{bullets}</ul>' if bullets else ''}
        </div>
      </div>""")
    return "\n".join(items)


def generate_standalone_html(config: PortfolioConfig) -> str:
    """Generates a complete, self-contained portfolio HTML page."""
    theme_key = config.theme if config.theme in THEMES else "dark_cyber"
    t = THEMES[theme_key]

    name = _e(config.hero_headline.replace("Hi, I'm ", "").split(" — ")[0] if " — " in config.hero_headline else config.hero_headline)
    headline = _e(config.hero_headline)
    bio = _e(config.hero_bio)
    accent = t["accent"]

    # Skills section
    all_skills = config.skills_spotlight[:12]
    skills_html = _skill_badges(all_skills, t)

    # Projects section
    projects_html = _project_cards(config.projects, t)

    # Experience section
    exp_html = _experience_items(config.experience_timeline)

    # Social links
    socials = config.social_links or {}
    social_links_html = ""
    if socials.get("github"):
        social_links_html += f'<a href="{_e(socials["github"])}" target="_blank" rel="noopener" class="social-link">GitHub</a>'
    if socials.get("linkedin"):
        social_links_html += f'<a href="{_e(socials["linkedin"])}" target="_blank" rel="noopener" class="social-link">LinkedIn</a>'
    if socials.get("portfolio"):
        social_links_html += f'<a href="{_e(socials["portfolio"])}" target="_blank" rel="noopener" class="social-link">Portfolio</a>'
    email = socials.get("email", "")
    if email and config.contact_email_enabled:
        social_links_html += f'<a href="mailto:{_e(email)}" class="social-link">Email</a>'

    subdomain = _e(config.subdomain)
    is_dark = t["bg"].startswith("#0") or t["bg"].startswith("#1") or t["bg"].startswith("#F0F") or t["bg"].startswith("#FFF") or t["bg"].startswith("#F8")
    # Determine if light theme for nav border
    is_light_bg = t["bg"].startswith("#F") or t["bg"].startswith("#f")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="description" content="{name} — Professional Portfolio. {bio[:120]}"/>
  <title>{name} — Portfolio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <style>
    /* ── Reset & Base ── */
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    :root {{
      --bg: {t["bg"]};
      --bg-card: {t["bg_card"]};
      --bg-nav: {t["bg_nav"]};
      --text: {t["text"]};
      --text-muted: {t["text_muted"]};
      --accent: {t["accent"]};
      --accent-hover: {t["accent_hover"]};
      --border: {t["border"]};
      --skill-bg: {t["skill_bg"]};
      --skill-border: {t["skill_border"]};
      --font: {t["font"]};
      --radius: 12px;
      --radius-sm: 8px;
    }}

    html {{ scroll-behavior: smooth; }}
    body {{
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
      font-size: 16px;
      -webkit-font-smoothing: antialiased;
    }}

    /* ── Nav ── */
    nav {{
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: var(--bg-nav);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 0 2rem;
      height: 60px;
      display: flex; align-items: center; justify-content: space-between;
    }}
    .nav-brand {{
      font-weight: 700; font-size: 1rem; color: var(--text);
      text-decoration: none;
    }}
    .nav-links {{
      display: flex; gap: 1.5rem; align-items: center;
      list-style: none;
    }}
    .nav-links a {{
      color: var(--text-muted); text-decoration: none;
      font-size: 0.875rem; font-weight: 500;
      transition: color 0.2s;
    }}
    .nav-links a:hover {{ color: var(--accent); }}

    /* Hamburger for mobile */
    .nav-toggle {{ display: none; background: none; border: none; cursor: pointer; color: var(--text); font-size: 1.5rem; }}
    @media (max-width: 640px) {{
      .nav-links {{ display: none; position: absolute; top: 60px; left: 0; right: 0; background: var(--bg-nav); border-bottom: 1px solid var(--border); flex-direction: column; padding: 1rem 2rem; gap: 0.75rem; }}
      .nav-links.open {{ display: flex; }}
      .nav-toggle {{ display: block; }}
    }}

    /* ── Layout ── */
    .container {{ max-width: 1100px; margin: 0 auto; padding: 0 2rem; }}
    section {{ padding: 6rem 0; }}
    section:first-of-type {{ padding-top: 8rem; }}

    /* ── Hero ── */
    #hero {{
      min-height: 100vh;
      display: flex; align-items: center;
      padding-top: 60px;
      background: {t["hero_bg"]}, var(--bg);
    }}
    .hero-inner {{ padding: 4rem 2rem; max-width: 1100px; margin: 0 auto; }}
    .hero-available {{
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.35rem 0.875rem;
      border: 1px solid var(--accent);
      border-radius: 100px;
      color: var(--accent);
      font-size: 0.8rem; font-weight: 600;
      margin-bottom: 1.5rem;
    }}
    .hero-dot {{ width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: pulse 2s ease-in-out infinite; }}
    @keyframes pulse {{ 0%, 100% {{ opacity: 1; transform: scale(1); }} 50% {{ opacity: 0.5; transform: scale(0.85); }} }}
    h1.hero-name {{
      font-size: clamp(2.25rem, 5vw, 3.75rem);
      font-weight: 800; line-height: 1.15; letter-spacing: -0.02em;
      background: {t["heading_gradient"]};
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
    }}
    .hero-bio {{
      font-size: 1.0625rem; color: var(--text-muted);
      max-width: 640px; line-height: 1.75;
      margin-bottom: 2rem;
    }}
    .hero-actions {{ display: flex; flex-wrap: wrap; gap: 0.875rem; align-items: center; }}
    .btn-primary {{
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--accent); color: #fff;
      border-radius: var(--radius-sm); font-weight: 600; font-size: 0.9rem;
      text-decoration: none; border: none; cursor: pointer;
      transition: background 0.2s, transform 0.15s;
    }}
    .btn-primary:hover {{ background: var(--accent-hover); transform: translateY(-1px); }}
    .social-link {{
      display: inline-flex; align-items: center;
      padding: 0.6rem 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      text-decoration: none; font-size: 0.875rem; font-weight: 500;
      transition: border-color 0.2s, color 0.2s;
    }}
    .social-link:hover {{ border-color: var(--accent); color: var(--accent); }}

    /* ── Section Headers ── */
    .section-header {{
      display: flex; align-items: center; gap: 1rem;
      margin-bottom: 2.5rem;
    }}
    .section-tag {{
      font-size: 0.75rem; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--accent);
    }}
    .section-line {{
      flex: 1; height: 1px; background: var(--border); max-width: 200px;
    }}
    h2.section-title {{
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 700; margin-bottom: 0.5rem;
      color: var(--text);
    }}

    /* ── Skills ── */
    #skills {{ background: var(--bg); }}
    .skills-row {{ display: flex; flex-wrap: wrap; gap: 0.625rem; }}
    .skill-badge {{
      padding: 0.4rem 0.875rem;
      border: 1px solid var(--skill-border);
      background: var(--skill-bg);
      border-radius: var(--radius-sm);
      font-size: 0.8125rem; font-weight: 600;
      color: var(--text);
      transition: border-color 0.2s, color 0.2s;
    }}
    .skill-badge:hover {{ border-color: var(--accent); color: var(--accent); }}

    /* ── Projects ── */
    #projects {{ background: var(--bg-card); }}
    .projects-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }}
    .project-card {{
      padding: 1.5rem;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      transition: border-color 0.2s, transform 0.2s;
      display: flex; flex-direction: column; gap: 0.875rem;
    }}
    .project-card:hover {{ border-color: var(--accent); transform: translateY(-2px); }}
    .proj-header {{ display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }}
    .proj-title {{ font-size: 1rem; font-weight: 700; color: var(--text); }}
    .proj-links {{ display: flex; gap: 0.5rem; flex-shrink: 0; }}
    .proj-link {{
      font-size: 0.75rem; font-weight: 600; color: var(--accent);
      text-decoration: none; padding: 0.2rem 0.5rem;
      border: 1px solid var(--accent);
      border-radius: 6px;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
    }}
    .proj-link:hover {{ background: var(--accent); color: #fff; }}
    .proj-desc {{ font-size: 0.875rem; color: var(--text-muted); line-height: 1.65; flex: 1; }}
    .proj-techs {{ display: flex; flex-wrap: wrap; gap: 0.4rem; }}
    .tech-badge {{
      padding: 0.2rem 0.5rem;
      background: var(--skill-bg);
      border: 1px solid var(--skill-border);
      border-radius: 6px;
      font-size: 0.7rem; color: var(--text-muted);
    }}

    /* ── Experience ── */
    #experience {{ background: var(--bg); }}
    .exp-timeline {{ display: flex; flex-direction: column; gap: 2rem; }}
    .exp-item {{
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 1.5rem;
      position: relative;
    }}
    .exp-item::before {{
      content: '';
      position: absolute;
      left: 140px;
      top: 0; bottom: -2rem;
      width: 1px;
      background: var(--border);
    }}
    .exp-item:last-child::before {{ display: none; }}
    .exp-left {{ text-align: right; padding-right: 1.5rem; position: relative; }}
    .exp-left::after {{
      content: '';
      position: absolute;
      right: -0.5rem; top: 0.35rem;
      width: 10px; height: 10px;
      border-radius: 50%;
      background: var(--accent);
      border: 2px solid var(--bg);
    }}
    .exp-period {{ font-size: 0.8rem; color: var(--accent); font-weight: 600; }}
    .exp-location {{ font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; }}
    .exp-content {{ padding-top: 0.1rem; }}
    .exp-role {{ font-size: 1rem; font-weight: 700; color: var(--text); }}
    .exp-company {{ font-size: 0.875rem; color: var(--accent); font-weight: 600; margin-top: 0.2rem; }}
    .exp-bullets {{ margin-top: 0.75rem; padding-left: 1.25rem; }}
    .exp-bullets li {{ font-size: 0.8625rem; color: var(--text-muted); margin-bottom: 0.35rem; line-height: 1.6; }}

    @media (max-width: 640px) {{
      .exp-item {{ grid-template-columns: 1fr; gap: 0.5rem; }}
      .exp-item::before {{ display: none; }}
      .exp-left {{ text-align: left; padding-right: 0; }}
      .exp-left::after {{ display: none; }}
    }}

    /* ── Contact / Footer ── */
    #contact {{ background: var(--bg-card); text-align: center; }}
    .contact-email {{
      font-size: 1.25rem; font-weight: 700;
      color: var(--accent); text-decoration: none;
      border-bottom: 2px solid transparent;
      transition: border-color 0.2s;
    }}
    .contact-email:hover {{ border-color: var(--accent); }}
    .contact-socials {{ display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem; }}

    footer {{
      background: var(--bg);
      border-top: 1px solid var(--border);
      text-align: center;
      padding: 1.5rem 2rem;
      font-size: 0.8rem;
      color: var(--text-muted);
    }}

    /* ── Back to top ── */
    .back-top {{
      position: fixed; bottom: 2rem; right: 2rem; z-index: 50;
      width: 42px; height: 42px;
      background: var(--accent);
      color: #fff;
      border: none; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 1.1rem;
      opacity: 0; transform: translateY(10px);
      transition: opacity 0.3s, transform 0.3s;
      text-decoration: none;
    }}
    .back-top.visible {{ opacity: 1; transform: translateY(0); }}
  </style>
</head>
<body>

<!-- Navigation -->
<nav>
  <a href="#hero" class="nav-brand">{_e(config.subdomain)}.dev</a>
  <button class="nav-toggle" onclick="document.querySelector('.nav-links').classList.toggle('open')" aria-label="Toggle menu">☰</button>
  <ul class="nav-links">
    <li><a href="#skills">Skills</a></li>
    <li><a href="#projects">Projects</a></li>
    <li><a href="#experience">Experience</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
</nav>

<!-- Hero -->
<section id="hero">
  <div class="hero-inner">
    <div class="hero-available">
      <span class="hero-dot"></span>
      Available for Opportunities
    </div>
    <h1 class="hero-name">{headline}</h1>
    <p class="hero-bio">{bio}</p>
    <div class="hero-actions">
      {f'<a href="mailto:{_e(email)}" class="btn-primary">Get in Touch</a>' if email else ''}
      {social_links_html}
    </div>
  </div>
</section>

<!-- Skills -->
<section id="skills">
  <div class="container">
    <div class="section-header">
      <span class="section-tag">Expertise</span>
      <div class="section-line"></div>
    </div>
    <h2 class="section-title">Core Skills</h2>
    {skills_html}
  </div>
</section>

<!-- Projects -->
<section id="projects">
  <div class="container">
    <div class="section-header">
      <span class="section-tag">Work</span>
      <div class="section-line"></div>
    </div>
    <h2 class="section-title">Featured Projects</h2>
    <div class="projects-grid">
      {projects_html}
    </div>
  </div>
</section>

<!-- Experience -->
<section id="experience">
  <div class="container">
    <div class="section-header">
      <span class="section-tag">Career</span>
      <div class="section-line"></div>
    </div>
    <h2 class="section-title">Experience</h2>
    <div class="exp-timeline">
      {exp_html}
    </div>
  </div>
</section>

<!-- Contact -->
<section id="contact">
  <div class="container">
    <div class="section-header" style="justify-content:center">
      <span class="section-tag">Contact</span>
    </div>
    <h2 class="section-title">Get In Touch</h2>
    <p style="color:var(--text-muted); max-width:480px; margin: 0.75rem auto 0;">
      Open to new opportunities, collaborations, and interesting conversations.
    </p>
    {f'<div style="margin-top:1.5rem"><a href="mailto:{_e(email)}" class="contact-email">{_e(email)}</a></div>' if email else ''}
    <div class="contact-socials">{social_links_html}</div>
  </div>
</section>

<footer>
  <p>&copy; {_e(config.subdomain)} · Built with Career AI Portfolio Studio</p>
</footer>

<a href="#hero" class="back-top" id="backTop" aria-label="Back to top">↑</a>

<script>
  // Back-to-top button
  const backTop = document.getElementById('backTop');
  window.addEventListener('scroll', () => {{
    if (window.scrollY > 400) backTop.classList.add('visible');
    else backTop.classList.remove('visible');
  }});

  // Smooth reveal animations
  const observer = new IntersectionObserver((entries) => {{
    entries.forEach(e => {{
      if (e.isIntersecting) {{
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }}
    }});
  }}, {{ threshold: 0.1 }});

  document.querySelectorAll('.project-card, .exp-item, .skill-badge').forEach(el => {{
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  }});
</script>
</body>
</html>"""


def generate_readme(config: PortfolioConfig) -> str:
    """Generates a README.md with GitHub Pages deployment instructions."""
    name = config.hero_headline
    subdomain = config.subdomain
    return f"""# {name} — Portfolio

Generated by **Career AI Portfolio Studio**.

## 🚀 Deploy to GitHub Pages (Free Hosting)

1. **Create a new repository** on GitHub named `{subdomain}.github.io`  
   *(or any name — it will be deployed to `https://yourusername.github.io/repo-name`)*

2. **Upload `index.html`** to the repository root.

3. Go to **Settings → Pages** in your repository.

4. Under **Source**, select **Deploy from a branch** → **main** → **/ (root)**.

5. Click **Save**. Your portfolio will be live at:  
   `https://yourgithubusername.github.io/{subdomain}/`

## 📁 File Structure

```
{subdomain}-portfolio/
├── index.html   ← Complete self-contained portfolio
└── README.md    ← This file
```

## 🎨 Theme

This portfolio uses the **{THEMES.get(config.theme, THEMES["dark_cyber"])["name"]}** theme.

## ✏️ Customization

Open `index.html` in any text editor to customize colors, fonts, and content.
The CSS custom properties (variables) at the top of the `<style>` block control the theme.

---

*Generated by Career AI — Professional Resume & Portfolio Builder*
"""


def generate_zip(config: PortfolioConfig) -> BytesIO:
    """Returns a BytesIO ZIP containing index.html + README.md."""
    html_content = generate_standalone_html(config)
    readme_content = generate_readme(config)

    buffer = BytesIO()
    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("index.html", html_content.encode("utf-8"))
        zf.writestr("README.md", readme_content.encode("utf-8"))
    buffer.seek(0)
    return buffer
