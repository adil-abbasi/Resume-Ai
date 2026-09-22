"""
100+ Resume Template Catalog Database
======================================
Categorized, searchable catalog of over 100 resume templates spanning:
- Modern
- Minimal
- Professional
- Classic
- Creative
- ATS-friendly
- Student
- Executive
- One-page
- Two-page
"""

from typing import List, Dict, Optional
from models.auth_schemas import TemplateItem

# Base template definitions programmatically expanded to 100+ unique designed templates
CATEGORIES = [
    "Modern",
    "Minimal",
    "Professional",
    "Classic",
    "Creative",
    "ATS-friendly",
    "Student",
    "Executive",
    "One-page",
    "Two-page"
]

COLOR_PALETTES = [
    ("#2563EB", "#1E293B", "Electric Blue"),
    ("#059669", "#064E3B", "Emerald Green"),
    ("#7C3AED", "#2E1065", "Royal Violet"),
    ("#DC2626", "#450A0A", "Crimson Red"),
    ("#D97706", "#451A03", "Amber Gold"),
    ("#0F172A", "#334155", "Slate Obsidian"),
    ("#0284C7", "#0C4A6E", "Sky Azure"),
    ("#0D9488", "#134E4A", "Teal Horizon"),
    ("#4F46E5", "#1E1B4B", "Indigo Velvet"),
    ("#E11D48", "#4C0519", "Rosewood"),
    ("#475569", "#0F172A", "Monochrome Slate"),
    ("#3B82F6", "#172554", "Cobalt Focus")
]

FONTS = ["Inter", "Outfit", "Plus Jakarta", "Roboto", "Merriweather", "Playfair"]

RAW_TEMPLATE_DEFS = [
    # Modern Templates
    ("modern_aurora", "Aurora Modern", "Sleek dual-column layout with glowing gradient accent bars", "Modern", False, "#2563EB", "#1E293B", "Inter", "two_column", ["gradient", "sidebar", "tech"]),
    ("modern_nexus", "Nexus Tech", "Engineered for software engineers and systems architects", "Modern", True, "#0284C7", "#0C4A6E", "Plus Jakarta", "two_column", ["developer", "metrics", "modern"]),
    ("modern_cyber", "Cyber Pulse", "High-contrast dark header with vivid electric accents", "Modern", True, "#7C3AED", "#2E1065", "Outfit", "header_accent", ["tech", "cyber", "bold"]),
    ("modern_strata", "Strata Clean", "Tiered horizontal flow with streamlined competency cards", "Modern", False, "#0D9488", "#134E4A", "Inter", "single_column", ["streamlined", "tech"]),
    ("modern_vertex", "Vertex High-Growth", "Tailored for fast-paced tech startups and scaleup engineers", "Modern", True, "#4F46E5", "#1E1B4B", "Plus Jakarta", "two_column", ["startup", "scaleup", "saas"]),
    ("modern_prism", "Prism Gradient", "Subtle neon color accents with badge-styled skill tags", "Modern", True, "#E11D48", "#4C0519", "Outfit", "two_column", ["gradient", "badge", "creative"]),
    ("modern_orbit", "Orbit Fullstack", "Focused on technical stacks, API metrics, and architecture", "Modern", True, "#2563EB", "#1E293B", "Inter", "two_column", ["fullstack", "architect"]),
    ("modern_linear", "Linear Monolith", "Minimalist tech layout inspired by modern developer tooling", "Modern", False, "#0F172A", "#334155", "Roboto", "single_column", ["linear", "clean", "developer"]),
    ("modern_vector", "Vector Grid", "Modular grid layout with fast-scan skill pills", "Modern", True, "#059669", "#064E3B", "Plus Jakarta", "two_column", ["grid", "pills", "engineering"]),
    ("modern_pulse", "Pulse Metric", "Highlighting measurable achievements and KPIs cleanly", "Modern", True, "#D97706", "#451A03", "Inter", "two_column", ["metrics", "kpi", "growth"]),

    # Minimal Templates
    ("minimal_clean", "Minimal Pure", "Maximum whitespace, refined typography, and zero distraction", "Minimal", False, "#0F172A", "#475569", "Inter", "single_column", ["clean", "whitespace", "universal"]),
    ("minimal_serif", "Serif Elegance", "Literary Merriweather headers with sophisticated spacing", "Minimal", True, "#1E293B", "#334155", "Merriweather", "single_column", ["editorial", "serif", "clean"]),
    ("minimal_zen", "Zenith Monochrome", "Pure black-and-white harmony optimized for high visual clarity", "Minimal", False, "#000000", "#1E293B", "Outfit", "single_column", ["monochrome", "zen"]),
    ("minimal_nordic", "Nordic Studio", "Scandinavian-inspired balance with light hairline dividers", "Minimal", True, "#334155", "#64748B", "Plus Jakarta", "single_column", ["scandinavian", "light", "airy"]),
    ("minimal_swiss", "Swiss Grid", "International typographic style with asymmetrical margin balance", "Minimal", True, "#0F172A", "#DC2626", "Roboto", "two_column", ["swiss", "bauhaus", "typography"]),
    ("minimal_haze", "Haze Whisper", "Ultra-light gray accents and subtle uppercase metadata", "Minimal", True, "#475569", "#94A3B8", "Inter", "single_column", ["whisper", "light", "simple"]),
    ("minimal_mono", "Mono Line", "Clean mono-spaced headers with strict left alignment", "Minimal", False, "#0F172A", "#334155", "Roboto", "single_column", ["mono", "precise", "direct"]),
    ("minimal_loft", "Loft Studio", "Airy structure designed for design leads and product thinkers", "Minimal", True, "#1E293B", "#475569", "Outfit", "single_column", ["product", "design", "clean"]),
    ("minimal_slate", "Slate Baseline", "Neutral slate tones with compact vertical rhythm", "Minimal", False, "#334155", "#0F172A", "Inter", "single_column", ["slate", "baseline"]),
    ("minimal_subtle", "Subtle Border", "Framed with delicate 1px border cards and subtle shadows", "Minimal", True, "#2563EB", "#1E293B", "Plus Jakarta", "single_column", ["framed", "delicate"]),

    # Professional Templates
    ("prof_corporate", "Corporate Standard", "The enterprise standard for finance, tech, and consulting", "Professional", False, "#2563EB", "#1E293B", "Inter", "single_column", ["enterprise", "standard", "consulting"]),
    ("prof_consulting", "McKinsey Advisory", "Structured bullet hierarchy with high emphasis on business outcomes", "Professional", True, "#1E3A8A", "#1E293B", "Merriweather", "single_column", ["consulting", "advisory", "strategy"]),
    ("prof_banking", "Wall Street Prime", "Compact, high-density format preferred by investment banking", "Professional", True, "#0F172A", "#1E293B", "Merriweather", "single_column", ["banking", "finance", "dense"]),
    ("prof_legal", "Bar Juris", "Formal, traditional format with classical roman typography", "Professional", True, "#1E293B", "#0F172A", "Merriweather", "single_column", ["legal", "compliance", "formal"]),
    ("prof_fintech", "Fintech Momentum", "Modern corporate fusion with deep navy and cobalt highlights", "Professional", False, "#0284C7", "#0F172A", "Plus Jakarta", "two_column", ["fintech", "payments", "tech"]),
    ("prof_summit", "Summit Global", "Structured for multinational leaders and program directors", "Professional", True, "#0D9488", "#115E59", "Inter", "two_column", ["leadership", "global", "director"]),
    ("prof_healthcare", "Clinical Vanguard", "Tailored for medical, biotech, and clinical operations", "Professional", False, "#059669", "#064E3B", "Roboto", "single_column", ["healthcare", "biotech", "clinical"]),
    ("prof_capital", "Capital Horizon", "Clean metric callouts for venture capital and portfolio managers", "Professional", True, "#D97706", "#451A03", "Outfit", "two_column", ["vc", "finance", "growth"]),
    ("prof_enterprise", "Enterprise Lead", "Designed for Fortune 500 solutions engineers and IT managers", "Professional", True, "#4F46E5", "#1E1B4B", "Inter", "two_column", ["enterprise", "solutions", "it"]),
    ("prof_operations", "Ops Vanguard", "Efficiency-oriented layout for supply chain & operations leads", "Professional", False, "#334155", "#0F172A", "Roboto", "single_column", ["operations", "logistics"]),

    # Classic Templates
    ("classic_times", "Classic Heritage", "Timeless single-column layout with elegant serif headings", "Classic", False, "#000000", "#1F2937", "Merriweather", "single_column", ["classic", "heritage", "traditional"]),
    ("classic_oxford", "Oxford Academic", "Traditional British academic standard with centered headers", "Classic", True, "#1E293B", "#334155", "Playfair", "single_column", ["academic", "research", "oxford"]),
    ("classic_cambridge", "Cambridge Scholar", "Emphasizes publications, fellowships, and pedagogy", "Classic", True, "#0F172A", "#1E293B", "Merriweather", "single_column", ["scholar", "publications", "higher-ed"]),
    ("classic_roman", "Roman Chronicle", "Distinguished formal look with understated dividing rules", "Classic", False, "#111827", "#374151", "Playfair", "single_column", ["roman", "formal", "distinguished"]),
    ("classic_diplomat", "Diplomat Bureau", "Designed for governmental, diplomatic, and public sector roles", "Classic", True, "#1E3A8A", "#172554", "Merriweather", "single_column", ["diplomat", "government", "policy"]),
    ("classic_ivy", "Ivy League Standard", "The iconic Harvard & Yale career center resume blueprint", "Classic", False, "#000000", "#111827", "Merriweather", "single_column", ["ivy-league", "standard", "alumni"]),
    ("classic_monarch", "Monarch Gold", "Classic serif layout with subtle antiqued gold section rules", "Classic", True, "#D97706", "#451A03", "Playfair", "single_column", ["monarch", "gold", "prestigious"]),
    ("classic_press", "University Press", "Clean scholarly formatting with wide readable margins", "Classic", False, "#1F2937", "#4B5563", "Merriweather", "single_column", ["scholarly", "clean", "editorial"]),
    ("classic_chancery", "Chancery Protocol", "Formal legal and administrative structure", "Classic", True, "#0F172A", "#1E293B", "Playfair", "single_column", ["legal", "protocol"]),
    ("classic_tribune", "Tribune Dispatch", "Editorial newspaper column styling with rich contrast", "Classic", True, "#111827", "#1F2937", "Merriweather", "single_column", ["editorial", "journalism"]),

    # Creative Templates
    ("creative_portfolio", "Studio Portfolio", "Vibrant gradient sidebar with visual project showcase pins", "Creative", True, "#7C3AED", "#2E1065", "Outfit", "two_column", ["portfolio", "visual", "designer"]),
    ("creative_bold", "Bold Impact", "High-energy headline banners with modern typography", "Creative", False, "#DC2626", "#450A0A", "Plus Jakarta", "header_accent", ["bold", "impact", "marketing"]),
    ("creative_neon", "Neon Cyberpunk", "Futuristic dark-mode accents with glowing skill chips", "Creative", True, "#06B6D4", "#083344", "Outfit", "two_column", ["futuristic", "gaming", "web3"]),
    ("creative_canvas", "Artisan Canvas", "Warm earth-tone accents for creative directors and illustrators", "Creative", True, "#D97706", "#78350F", "Playfair", "two_column", ["artisan", "director", "warm"]),
    ("creative_agency", "Agency Pitch", "Deck-styled presentation formatting with visual skill bars", "Creative", True, "#EC4899", "#831843", "Plus Jakarta", "two_column", ["agency", "pitch", "creative"]),
    ("creative_duotone", "Duotone Wave", "Two-tone visual split between profile summary and achievements", "Creative", False, "#2563EB", "#7C3AED", "Inter", "two_column", ["duotone", "wave"]),
    ("creative_prism_ui", "UI Designer Pro", "Optimized to display Figma systems, user research, and metrics", "Creative", True, "#8B5CF6", "#4C1D95", "Outfit", "two_column", ["ui-ux", "product-design", "figma"]),
    ("creative_pop", "Pop Modernist", "Playful geometric layout with high-impact badge elements", "Creative", True, "#F59E0B", "#78350F", "Plus Jakarta", "header_accent", ["pop", "geometric"]),
    ("creative_gradient_flow", "Gradient Flow", "Smooth multi-hue header for digital marketing and content creators", "Creative", False, "#3B82F6", "#8B5CF6", "Outfit", "header_accent", ["marketing", "social", "content"]),
    ("creative_editorial", "Vogue Editorial", "Fashion & media inspired magazine layout with elegant typography", "Creative", True, "#0F172A", "#E11D48", "Playfair", "single_column", ["fashion", "media", "magazine"]),

    # ATS-friendly Templates
    ("ats_clean", "ATS Standard 100", "100% compliant deterministic ATS parser-friendly structure", "ATS-friendly", False, "#0F172A", "#1E293B", "Inter", "single_column", ["ats", "guaranteed", "compatible"]),
    ("ats_tech_parser", "ATS Tech Matrix", "Keyword-dense layout engineered to pass Taleo, Greenhouse, & Lever", "ATS-friendly", True, "#2563EB", "#1E293B", "Roboto", "single_column", ["greenhouse", "lever", "taleo"]),
    ("ats_bulletproof", "ATS Bulletproof", "Zero tables, zero graphics, pure compliant semantic markup", "ATS-friendly", False, "#000000", "#111827", "Inter", "single_column", ["bulletproof", "raw-ats"]),
    ("ats_workday", "ATS Workday Optimizer", "Calibrated for Workday recruiter screen algorithms", "ATS-friendly", True, "#1E3A8A", "#1E293B", "Roboto", "single_column", ["workday", "recruiter", "enterprise"]),
    ("ats_icims", "ATS iCIMS Precision", "Section headings formatted strictly to top ATS taxonomy standards", "ATS-friendly", True, "#0D9488", "#134E4A", "Inter", "single_column", ["icims", "precision"]),
    ("ats_brassring", "ATS BrassRing Clean", "Single column with standard date & contact parsers", "ATS-friendly", False, "#334155", "#0F172A", "Roboto", "single_column", ["brassring", "compliance"]),
    ("ats_smartrecruiters", "ATS SmartRecruiters", "Optimized skill tokenization for instant recruiter matches", "ATS-friendly", True, "#059669", "#064E3B", "Inter", "single_column", ["smartrecruiters", "tokens"]),
    ("ats_bamboohr", "ATS BambooHR", "Friendly yet strictly machine-readable hierarchy", "ATS-friendly", False, "#0284C7", "#0F172A", "Plus Jakarta", "single_column", ["bamboohr", "hr"]),
    ("ats_succesfactors", "ATS SAP SuccessFactors", "Corporate HR scanner compliant layout", "ATS-friendly", True, "#1E293B", "#0F172A", "Roboto", "single_column", ["sap", "successfactors"]),
    ("ats_universal", "ATS Universal Pass", "Verified across 15+ modern ATS candidate ranking engines", "ATS-friendly", True, "#2563EB", "#1E293B", "Inter", "single_column", ["universal", "top-rated"]),

    # Student / Graduate Templates
    ("student_campus", "Campus First", "Spotlights degree, coursework, GPA, and campus leadership", "Student", False, "#2563EB", "#1E293B", "Inter", "single_column", ["internship", "college", "graduate"]),
    ("student_stem", "STEM Undergraduate", "Technical projects & lab research placed prominently at top", "Student", True, "#0284C7", "#0C4A6E", "Plus Jakarta", "two_column", ["stem", "cs", "engineering"]),
    ("student_bootcamp", "Bootcamp Grad", "High focus on GitHub projects, full-stack stacks, and live apps", "Student", False, "#7C3AED", "#2E1065", "Outfit", "two_column", ["bootcamp", "junior", "projects"]),
    ("student_fellow", "Research Fellow", "Highlights published papers, conference talks, and honors", "Student", True, "#059669", "#064E3B", "Merriweather", "single_column", ["research", "fellowship", "academic"]),
    ("student_intern", "Internship Seeker", "Compact format making the most of 1-2 summer internships", "Student", False, "#D97706", "#451A03", "Inter", "single_column", ["internship", "co-op"]),
    ("student_entry_tech", "Junior SWE Launchpad", "Structured to win first entry-level engineering interviews", "Student", True, "#4F46E5", "#1E1B4B", "Plus Jakarta", "two_column", ["junior", "swe", "faang"]),
    ("student_business", "Business School Grad", "Case study competitions, finance club, and consulting projects", "Student", True, "#1E3A8A", "#1E293B", "Roboto", "single_column", ["mba", "bba", "business"]),
    ("student_scholar", "Honors Scholar", "Emphasizes Dean's list, scholarships, and academic excellence", "Student", False, "#0D9488", "#134E4A", "Merriweather", "single_column", ["scholar", "honors"]),
    ("student_hackathon", "Hackathon Winner", "Spotlights hackathon awards, open-source commits, and repos", "Student", True, "#E11D48", "#4C0519", "Outfit", "two_column", ["hackathon", "open-source"]),
    ("student_fresher", "Fresher All-Rounder", "Balanced breakdown of education, skills, and extracurriculars", "Student", False, "#334155", "#0F172A", "Inter", "single_column", ["fresher", "starter"]),

    # Executive Templates
    ("exec_csuite", "C-Suite Strategic", "Commanding header with board-level executive summary and P&L metrics", "Executive", True, "#0F172A", "#D97706", "Playfair", "header_accent", ["ceo", "cto", "c-suite"]),
    ("exec_vp", "VP Operations", "Highlights organizational transformation, revenue growth, and team scale", "Executive", True, "#1E3A8A", "#1E293B", "Inter", "two_column", ["vp", "director", "scale"]),
    ("exec_board", "Board Member Advisory", "Distinguished summary for advisory boards and non-executive roles", "Executive", True, "#1E293B", "#334155", "Merriweather", "single_column", ["board", "advisory", "governance"]),
    ("exec_cto", "CTO Architecture & Vision", "Balancing deep technical architecture with executive engineering leadership", "Executive", True, "#2563EB", "#0F172A", "Plus Jakarta", "two_column", ["cto", "engineering-director"]),
    ("exec_cpo", "CPO Product Vision", "Showcases product strategy, user scale (10M+), and ARR milestones", "Executive", True, "#7C3AED", "#1E1B4B", "Outfit", "two_column", ["cpo", "product-vp"]),
    ("exec_cfo", "CFO Fiscal Leader", "Audit, M&A, IPO readiness, and financial governance metrics", "Executive", True, "#064E3B", "#059669", "Merriweather", "single_column", ["cfo", "finance", "m-and-a"]),
    ("exec_partner", "Managing Partner", "Professional services and law firm partner format", "Executive", True, "#0F172A", "#1E293B", "Playfair", "single_column", ["partner", "managing-director"]),
    ("exec_president", "President & GM", "Full P&L responsibility and multi-region business unit management", "Executive", True, "#1E3A8A", "#0F172A", "Inter", "two_column", ["president", "general-manager"]),
    ("exec_founder", "Founder & Exited CEO", "Venture fundraising, zero-to-one traction, and exit track record", "Executive", True, "#4F46E5", "#1E1B4B", "Plus Jakarta", "header_accent", ["founder", "startup-exit"]),
    ("exec_global", "Global Enterprise Lead", "Cross-continental leadership spanning EMEA, APAC, and Americas", "Executive", True, "#0D9488", "#134E4A", "Inter", "two_column", ["global", "international"]),

    # One-page Templates
    ("onepage_compact", "One-Page Turbo", "Ultra-efficient density designed to guarantee 1 single page fit", "One-page", False, "#2563EB", "#1E293B", "Inter", "two_column", ["1-page", "compact", "dense"]),
    ("onepage_grid", "One-Page Bento", "Modern bento-box grid displaying skills, exp, and education cleanly", "One-page", True, "#0F172A", "#334155", "Plus Jakarta", "two_column", ["1-page", "bento", "modern"]),
    ("onepage_swe", "One-Page Tech Pro", "The standard 1-page format for FAANG & Silicon Valley tech screens", "One-page", False, "#0284C7", "#0C4A6E", "Roboto", "single_column", ["1-page", "faang", "swe"]),
    ("onepage_designer", "One-Page Creative", "Compact creative layout with bold contact bar and mini-portfolio", "One-page", True, "#7C3AED", "#2E1065", "Outfit", "two_column", ["1-page", "designer"]),
    ("onepage_minimal", "One-Page Clean Air", "Breathable 1-page layout using selective bullet spacing", "One-page", False, "#334155", "#0F172A", "Inter", "single_column", ["1-page", "minimal"]),
    ("onepage_lead", "One-Page Team Lead", "Highlighting leadership impact and key systems in 1 page", "One-page", True, "#059669", "#064E3B", "Plus Jakarta", "two_column", ["1-page", "lead"]),
    ("onepage_condensed", "One-Page Condensed", "Narrow margins with 3-column footer for skills and tools", "One-page", True, "#DC2626", "#450A0A", "Roboto", "single_column", ["1-page", "condensed"]),
    ("onepage_fastscan", "One-Page 6-Second Scan", "Engineered for 6-second recruiter eye-tracking patterns", "One-page", True, "#2563EB", "#1E293B", "Inter", "two_column", ["1-page", "eye-tracking", "recruiter"]),
    ("onepage_spotlight", "One-Page Spotlight", "Hero summary header with concise chronological achievements", "One-page", False, "#D97706", "#451A03", "Outfit", "header_accent", ["1-page", "spotlight"]),
    ("onepage_atomic", "One-Page Atomic", "Minimalist bullet cards organized for quick readability", "One-page", True, "#4F46E5", "#1E1B4B", "Plus Jakarta", "two_column", ["1-page", "atomic"]),

    # Two-page Templates
    ("twopage_senior", "Two-Page Comprehensive", "Spacious 2-page flow for senior professionals with 10+ years exp", "Two-page", True, "#2563EB", "#1E293B", "Inter", "two_column", ["2-page", "senior", "detailed"]),
    ("twopage_architect", "Two-Page Enterprise Architect", "Ample room for deep patent listings, system diagrams, and stacks", "Two-page", True, "#0F172A", "#334155", "Plus Jakarta", "two_column", ["2-page", "architect", "patents"]),
    ("twopage_academic_cv", "Two-Page Academic CV", "Detailed sections for teaching, grants, publications, and dissertations", "Two-page", False, "#1E293B", "#0F172A", "Merriweather", "single_column", ["2-page", "academic", "cv"]),
    ("twopage_medical", "Two-Page Clinical Specialist", "Comprehensive clinical rotations, certifications, and hospital affiliations", "Two-page", True, "#059669", "#064E3B", "Roboto", "single_column", ["2-page", "medical", "clinical"]),
    ("twopage_director", "Two-Page Director Level", "Strategic roadmap achievements and multi-department management", "Two-page", True, "#1E3A8A", "#172554", "Inter", "two_column", ["2-page", "director"]),
    ("twopage_consultant", "Two-Page Principal Consultant", "Detailed client engagement logs, case studies, and transformation ROI", "Two-page", True, "#D97706", "#451A03", "Playfair", "single_column", ["2-page", "consultant"]),
    ("twopage_devops", "Two-Page Cloud & Infrastructure", "Extensive tooling index, multi-cloud migrations, and incident metrics", "Two-page", False, "#0284C7", "#0C4A6E", "Roboto", "two_column", ["2-page", "devops", "cloud"]),
    ("twopage_scientist", "Two-Page Senior Data Scientist", "ML models in production, arXiv papers, Kaggle titles, and benchmarks", "Two-page", True, "#7C3AED", "#2E1065", "Plus Jakarta", "two_column", ["2-page", "data-science", "ml"]),
    ("twopage_executive_suite", "Two-Page Executive Portfolio", "Extended executive narrative with milestone callouts", "Two-page", True, "#0F172A", "#475569", "Playfair", "header_accent", ["2-page", "executive"]),
    ("twopage_classic_long", "Two-Page Classic Heritage", "Traditional extended narrative format with timeless typography", "Two-page", False, "#111827", "#374151", "Merriweather", "single_column", ["2-page", "classic", "heritage"])
]


def build_full_template_catalog() -> List[TemplateItem]:
    """Generates the full catalog of 100+ unique templates across categories."""
    catalog: List[TemplateItem] = []
    
    # 1. Add core curated templates
    for item in RAW_TEMPLATE_DEFS:
        (t_id, name, desc, cat, is_pro, thumb_col, sec_col, font, layout, tags) = item
        catalog.append(TemplateItem(
            id=t_id,
            name=name,
            description=desc,
            category=cat,
            is_pro=is_pro,
            thumbnail_color=thumb_col,
            secondary_color=sec_col,
            font_family=font,
            layout_type=layout,
            spacing="normal",
            tags=tags + [cat.lower()],
            rating=4.9 if is_pro else 4.7,
            downloads_count=2400 if is_pro else 5100,
            recommended_for=[cat, "Career Growth"]
        ))

    # 2. Programmatically generate extended category variants to exceed 100 total
    counter = len(catalog)
    for cat in CATEGORIES:
        for idx in range(1, 6):
            palette = COLOR_PALETTES[(counter + idx) % len(COLOR_PALETTES)]
            font = FONTS[(counter + idx) % len(FONTS)]
            is_pro = (idx % 2 == 0) or (cat in ["Executive", "Two-page"])
            variant_id = f"{cat.lower().replace('-', '_').replace(' ', '_')}_pro_{idx}_{counter}"
            variant_name = f"{cat} Elite Edition {idx}"
            variant_desc = f"Engineered specifically for {cat.lower()} roles with {palette[2]} accents and {font} typography."
            
            catalog.append(TemplateItem(
                id=variant_id,
                name=variant_name,
                description=variant_desc,
                category=cat,
                is_pro=is_pro,
                thumbnail_color=palette[0],
                secondary_color=palette[1],
                font_family=font,
                layout_type="two_column" if idx % 2 == 0 else "single_column",
                spacing="compact" if "one-page" in cat.lower() else "normal",
                tags=[cat.lower(), "pro-design", palette[2].lower().replace(" ", "-")],
                rating=round(4.7 + (idx * 0.05), 2),
                downloads_count=1000 + (idx * 350),
                recommended_for=[cat, "Professional Applications"]
            ))
            counter += 1

    return catalog


ALL_TEMPLATES: List[TemplateItem] = build_full_template_catalog()
TEMPLATES_BY_ID: Dict[str, TemplateItem] = {t.id: t for t in ALL_TEMPLATES}


def get_templates(
    category: Optional[str] = None,
    search: Optional[str] = None,
    only_pro: Optional[bool] = None
) -> List[TemplateItem]:
    """Filters template database by category, keyword search, or plan tier."""
    results = ALL_TEMPLATES

    if category and category.lower() != "all":
        results = [t for t in results if t.category.lower() == category.lower()]

    if only_pro is not None:
        results = [t for t in results if t.is_pro == only_pro]

    if search:
        q = search.strip().lower()
        results = [
            t for t in results
            if q in t.name.lower() or q in t.description.lower() or any(q in tag for tag in t.tags) or q in t.category.lower()
        ]

    return results
