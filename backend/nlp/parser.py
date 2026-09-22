import re
import io
from typing import Dict, List, Any, Optional
from models.schemas import (
    ResumeProfile, ContactInfo, ExperienceItem, EducationItem,
    ProjectItem, CertificationItem, SkillsGroup, ExtractionValidationResult
)
from nlp.skill_database import ALL_SKILLS_MAP, SECTION_SYNONYMS, SKILL_CATEGORIES

# Optional document parsing libraries
try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import docx
    from docx.text.paragraph import Paragraph
    from docx.table import Table
except ImportError:
    docx = None


class ResumeParser:
    """
    Deterministic Resume Extractor & Parser.
    Extracts text from PDF/DOCX and converts unstructured resume content into structured ResumeProfile.
    Preserves raw_resume_text as the source of truth with 100% fidelity.
    """

    # Bullet point symbols to standardize
    BULLET_CHARS = [
        '\u2022', '\u2023', '\u25cf', '\u25cb', '\u25aa', '\u25ab', '\u25b8',
        '\u2043', '\u2219', '\u00b7', '▪', '▫', '►', '■', '•',
        '\uf0b7', '\uf0a7', '\uf0d8', '●', '○', '◆', '◇', '➢', '✓', '✔', '▶',
        '\x7f'
    ]

    @classmethod
    def extract_text_from_pdf(cls, file_bytes: bytes) -> str:
        """Extracts complete text from PDF bytes with layout awareness and bullet preservation."""
        if not pypdf:
            raise ImportError("pypdf is required for PDF parsing")
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        text_parts = []

        for page in reader.pages:
            extracted = None
            try:
                extracted = page.extract_text(extraction_mode="layout")
            except Exception:
                extracted = None

            if not extracted or len(extracted.strip()) < 10:
                try:
                    extracted = page.extract_text()
                except Exception:
                    extracted = ""

            # Check for rare PDF font spacing anomaly (single letters separated by spaces)
            if extracted:
                if re.search(r'\b[A-Za-z]\s[A-Za-z]\s[A-Za-z]\s[A-Za-z]\b', extracted):
                    try:
                        std = page.extract_text()
                        if std and len(std.strip()) > len(extracted.strip()) * 0.5:
                            extracted = std
                    except Exception:
                        pass
                text_parts.append(extracted)

        full_text = "\n".join(text_parts)

        # Standardize unicode bullet markers to '• '
        for b in cls.BULLET_CHARS:
            full_text = full_text.replace(b, '• ')

        # Standardize multiple spaces before bullet
        full_text = re.sub(r'^[ \t]*•[ \t]*|[ \t]+•[ \t]*', '\n• ', full_text, flags=re.MULTILINE)

        # Repair hyphenated wrapped words (e.g. "imple-\nmented" -> "implemented")
        full_text = re.sub(r'(\b\w+)-\n\s*(\w+\b)', r'\1\2', full_text)

        # Normalize excessive blank lines
        full_text = re.sub(r'\n{3,}', '\n\n', full_text)
        return full_text.strip()

    @classmethod
    def extract_text_from_docx(cls, file_bytes: bytes) -> str:
        """Extracts text from DOCX in true document reading order (paragraphs and tables interleaved)."""
        if not docx:
            raise ImportError("python-docx is required for DOCX parsing")
        doc = docx.Document(io.BytesIO(file_bytes))
        text_parts = []

        def is_docx_list_item(para: Paragraph) -> bool:
            """Check if a paragraph is styled or configured as a bullet or numbered list in Word."""
            if para.style and para.style.name:
                s_name = para.style.name.lower()
                if any(k in s_name for k in ['bullet', 'list', 'number']):
                    return True
            try:
                pPr = getattr(para._p, 'pPr', None)
                if pPr is not None and getattr(pPr, 'numPr', None) is not None:
                    return True
            except Exception:
                pass
            return False

        # Extract any text in headers
        header_texts = []
        try:
            for sec in doc.sections:
                if sec.header:
                    for hp in sec.header.paragraphs:
                        ht = hp.text.strip()
                        if ht and ht not in header_texts:
                            header_texts.append(ht)
        except Exception:
            pass

        if header_texts:
            text_parts.extend(header_texts)

        try:
            # Iterate through body children in visual document order
            for child in doc.element.body:
                if child.tag.endswith('p'):
                    para = Paragraph(child, doc)
                    p_text = para.text.strip()
                    if p_text:
                        is_bullet = is_docx_list_item(para)
                        if is_bullet and not p_text.startswith(('•', '-', '*', '–', '—', '>')):
                            p_text = f"• {p_text}"
                        text_parts.append(p_text)
                elif child.tag.endswith('tbl'):
                    tbl = Table(child, doc)
                    for row in tbl.rows:
                        row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                        if row_cells:
                            # Deduplicate merged cells
                            deduped = []
                            for c in row_cells:
                                if not deduped or c != deduped[-1]:
                                    deduped.append(c)
                            text_parts.append(" | ".join(deduped))
        except Exception:
            # Fallback if body iteration encounters unusual XML
            text_parts = [p.text for p in doc.paragraphs if p.text.strip()]
            for tbl in doc.tables:
                for row in tbl.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            text_parts.append(cell.text.strip())

        full_text = "\n".join(text_parts)
        for b in cls.BULLET_CHARS:
            full_text = full_text.replace(b, '• ')
        full_text = re.sub(r'[ \t]+•[ \t]*', '\n• ', full_text)
        full_text = re.sub(r'(\b\w+)-\n\s*(\w+\b)', r'\1\2', full_text)
        full_text = re.sub(r'\n{3,}', '\n\n', full_text)
        return full_text.strip()

    @classmethod
    def parse_text(cls, raw_text: str) -> ResumeProfile:
        """Parses raw plain text into structured candidate resume profile while preserving raw text."""
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        if not lines:
            return ResumeProfile(raw_resume_text=raw_text)

        contact_info = cls._extract_contact_info(lines, raw_text)
        sections = cls._segment_sections(lines)

        # Extract skills
        skills_group = cls._extract_skills(raw_text, sections.get("skills", []))

        # Extract summary
        summary = cls._extract_summary(sections.get("summary", []))

        # Extract work experience (with full bullet & description reconstruction)
        work_experience = cls._extract_experience(sections.get("experience", []))

        # Extract education
        education = cls._extract_education(sections.get("education", []))

        # Extract projects (with title, tech, link, description, highlights)
        projects = cls._extract_projects(sections.get("projects", []))

        # Extract certifications
        certifications = cls._extract_certifications(sections.get("certifications", []))

        # Extract achievements & extracurriculars
        achievements = cls._extract_bullets(sections.get("achievements", []))
        extracurriculars = cls._extract_bullets(sections.get("extracurriculars", []))

        # Extract spoken languages
        languages = cls._extract_languages(sections.get("languages", []), raw_text)

        # Map unclassified section lines to achievements or extracurriculars if present
        if "other_section" in sections:
            for l in sections["other_section"]:
                clean = re.sub(r'^[•\-\*\–\—\>\s]+|^\d+[\.\)]\s*', '', l).strip()
                if clean and clean not in achievements:
                    achievements.append(clean)

        return ResumeProfile(
            id="parsed-resume",
            title=f"{contact_info.full_name}'s Resume" if contact_info.full_name else "My Professional Resume",
            target_role=contact_info.title,
            contact_info=contact_info,
            summary=summary,
            skills=skills_group,
            work_experience=work_experience,
            education=education,
            projects=projects,
            certifications=certifications,
            achievements=achievements,
            extracurriculars=extracurriculars,
            languages=languages,
            raw_resume_text=raw_text
        )

    @staticmethod
    def _extract_contact_info(lines: List[str], full_text: str) -> ContactInfo:
        contact = ContactInfo()

        # Name: typically top 1-4 lines before contact links
        for line in lines[:5]:
            if not ("@" in line or "http" in line.lower() or "linkedin" in line.lower() or "github" in line.lower() or any(c.isdigit() for c in line)):
                clean_name = re.sub(r'[^a-zA-Z\s\.\-]', '', line).strip()
                words = clean_name.split()
                if 2 <= len(words) <= 4:
                    # Verify it's not a common section header
                    if clean_name.lower() not in ["curriculum vitae", "resume", "contact", "profile", "summary", "contact info"]:
                        contact.full_name = clean_name
                        break

        if not contact.full_name and lines:
            contact.full_name = re.sub(r'[^a-zA-Z\s\.\-]', '', lines[0][:40]).strip()

        # Email
        email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', full_text)
        if email_match:
            contact.email = email_match.group(0).strip()

        # Phone: international or regional
        phone_match = re.search(r'(\+?\d{1,3}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}', full_text)
        if phone_match and len(re.sub(r'\D', '', phone_match.group(0))) >= 7:
            contact.phone = phone_match.group(0).strip()

        # Location: City, State or City, Country
        loc_match = re.search(r'([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\b|[A-Z][a-zA-Z\s]+,\s*(?:USA|UK|Canada|Germany|Pakistan|India|Australia|France))', full_text)
        if loc_match:
            contact.location = loc_match.group(0).strip()

        # LinkedIn
        linkedin_match = re.search(r'(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)', full_text, re.IGNORECASE)
        if linkedin_match:
            contact.linkedin = linkedin_match.group(0).strip()

        # GitHub
        github_match = re.search(r'(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)', full_text, re.IGNORECASE)
        if github_match:
            contact.github = github_match.group(0).strip()

        # Portfolio/Website
        portfolio_match = re.search(r'(?:https?:\/\/)(?!linkedin|github)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?', full_text, re.IGNORECASE)
        if portfolio_match:
            contact.portfolio = portfolio_match.group(0).strip()

        # Target Title / Headline from top lines
        title_keywords = [
            "engineer", "developer", "designer", "manager", "scientist", "architect",
            "lead", "specialist", "intern", "consultant", "analyst", "administrator"
        ]
        for line in lines[1:6]:
            line_l = line.lower()
            if any(role in line_l for role in title_keywords) and len(line.split()) <= 7:
                contact.title = line.strip(' |–-,')
                break

        return contact

    @classmethod
    def _segment_sections(cls, lines: List[str]) -> Dict[str, List[str]]:
        """Segments lines into sections using robust fuzzy and structural header matching."""
        sections: Dict[str, List[str]] = {}
        current_section = "header"
        sections[current_section] = []

        def is_bullet_line(l: str) -> bool:
            return bool(re.match(r'^[•\-\*\–\—\>\x7f]\s*|^\d+[\.\)]\s*', l))

        for line in lines:
            line_stripped = line.strip()
            line_lower = line_stripped.lower()

            # Clean markdown and decorative characters
            clean_header = re.sub(r'^[#*_\-=\s~]+|[#*_\-=\s~:]+$', '', line_lower).strip()

            detected_sec = None
            words = clean_header.split()

            # Guard: bullet lines are content, NOT section headers
            if not is_bullet_line(line_stripped):
                # Section titles are usually 1 to 6 words and don't end in periods or commas
                if 1 <= len(words) <= 6 and not line_stripped.endswith(('.', ',')):
                    # 1. Exact match with synonyms
                    for sec_key, synonyms in SECTION_SYNONYMS.items():
                        if clean_header in synonyms:
                            detected_sec = sec_key
                            break

                    # 2. Match without trailing colons/pipes/symbols
                    if not detected_sec:
                        stripped_punct = re.sub(r'[:|/\\_&=~-]', ' ', clean_header).strip()
                        # normalize extra spaces
                        stripped_punct = re.sub(r'\s+', ' ', stripped_punct)
                        for sec_key, synonyms in SECTION_SYNONYMS.items():
                            if stripped_punct in synonyms:
                                detected_sec = sec_key
                                break

                    # 3. Substring match for strong section headers
                    if not detected_sec and len(clean_header) >= 4:
                        for sec_key, synonyms in SECTION_SYNONYMS.items():
                            for syn in synonyms:
                                if len(syn) >= 5 and (clean_header == syn or clean_header.startswith(f"{syn} ") or clean_header.endswith(f" {syn}")):
                                    # Avoid false match on sentences like "Experience with React and Node.js"
                                    if not any(w in words for w in ["with", "using", "from", "for", "into", "building"]):
                                        detected_sec = sec_key
                                        break
                            if detected_sec:
                                break

            if detected_sec:
                current_section = detected_sec
                if current_section not in sections:
                    sections[current_section] = []
            else:
                sections[current_section].append(line_stripped)

        return sections

    @classmethod
    def _extract_skills(cls, full_text: str, skill_lines: List[str]) -> SkillsGroup:
        """Extracts skills ensuring zero candidate skills from the skills section are lost."""
        found_skills: Dict[str, List[str]] = {
            "technical_skills": [],
            "frameworks_libraries": [],
            "developer_tools": [],
            "soft_skills": [],
            "languages": [],
            "other": []
        }

        def add_skill(skill_name: str, target: Optional[str] = None):
            s = skill_name.strip(' ,|;•·▪-')
            if not s or len(s) > 40 or len(s) < 2:
                return
            s_lower = s.lower()
            if target:
                if s not in found_skills[target]:
                    found_skills[target].append(s)
            else:
                # Categorize via ALL_SKILLS_MAP if known, else other
                if s_lower in ALL_SKILLS_MAP:
                    meta = ALL_SKILLS_MAP[s_lower]
                    disp = meta["display"]
                    cat = meta["category"]
                    if cat == "Programming Languages" and disp not in found_skills["technical_skills"]:
                        found_skills["technical_skills"].append(disp)
                    elif cat == "Frameworks & Libraries" and disp not in found_skills["frameworks_libraries"]:
                        found_skills["frameworks_libraries"].append(disp)
                    elif cat in ["Developer Tools & Methods", "Databases & Caching", "Cloud & DevOps"] and disp not in found_skills["developer_tools"]:
                        found_skills["developer_tools"].append(disp)
                    elif cat == "Soft Skills & Leadership" and disp not in found_skills["soft_skills"]:
                        found_skills["soft_skills"].append(disp)
                    elif cat == "AI, ML & Data" and disp not in found_skills["technical_skills"]:
                        found_skills["technical_skills"].append(disp)
                    else:
                        if disp not in found_skills["technical_skills"]:
                            found_skills["technical_skills"].append(disp)
                else:
                    if s not in found_skills["other"] and s not in found_skills["technical_skills"]:
                        found_skills["other"].append(s)

        # 1. Parse the explicit skills section line-by-line
        for line in skill_lines:
            clean_l = re.sub(r'^[•\-\*\s]+', '', line).strip()
            if not clean_l:
                continue

            # Category prefix e.g. "Languages: Python, Go, TypeScript"
            if ":" in clean_l:
                parts = clean_l.split(":", 1)
                cat_label = parts[0].strip().lower()
                items_str = parts[1].strip()
                raw_items = re.split(r'[,\|;•·▪]\s*', items_str)

                target_group = "other"
                if any(w in cat_label for w in ["programming", "language", "coding"]):
                    target_group = "technical_skills"
                elif any(w in cat_label for w in ["framework", "library", "libraries"]):
                    target_group = "frameworks_libraries"
                elif any(w in cat_label for w in ["tool", "database", "devops", "cloud", "platform", "infrastructure"]):
                    target_group = "developer_tools"
                elif any(w in cat_label for w in ["soft", "leadership", "interpersonal"]):
                    target_group = "soft_skills"
                elif any(w in cat_label for w in ["spoken", "foreign"]):
                    target_group = "languages"

                for item in raw_items:
                    add_skill(item, target=target_group)
            else:
                # Delimited list without category colon (e.g. "Python • React • Node.js • Docker")
                if any(delim in clean_l for delim in ['•', '|', ',', ';']):
                    raw_items = re.split(r'[,\|;•·▪]\s*', clean_l)
                    for raw_it in raw_items:
                        add_skill(raw_it)
                else:
                    # Single skill on line (e.g. "Python")
                    add_skill(clean_l)

        # 2. Search whole resume for known high-value skills in ALL_SKILLS_MAP
        text_lower = full_text.lower()
        for skill_kw, meta in ALL_SKILLS_MAP.items():
            pattern = r'(?:\b|(?<=\s))' + re.escape(skill_kw) + r'(?:\b|(?=\s|,|\.|\/|\)))'
            if re.search(pattern, text_lower):
                disp = meta["display"]
                cat = meta["category"]
                if cat == "Programming Languages" and disp not in found_skills["technical_skills"]:
                    found_skills["technical_skills"].append(disp)
                elif cat == "Frameworks & Libraries" and disp not in found_skills["frameworks_libraries"]:
                    found_skills["frameworks_libraries"].append(disp)
                elif cat in ["Developer Tools & Methods", "Databases & Caching", "Cloud & DevOps"] and disp not in found_skills["developer_tools"]:
                    found_skills["developer_tools"].append(disp)
                elif cat == "Soft Skills & Leadership" and disp not in found_skills["soft_skills"]:
                    found_skills["soft_skills"].append(disp)
                elif cat == "AI, ML & Data" and disp not in found_skills["technical_skills"]:
                    found_skills["technical_skills"].append(disp)

        return SkillsGroup(**found_skills)

    @staticmethod
    def _extract_summary(summary_lines: List[str]) -> str:
        """Extracts professional summary text."""
        return " ".join([l.strip() for l in summary_lines if len(l.strip()) > 3]).strip()

    @classmethod
    def _extract_experience(cls, lines: List[str]) -> List[ExperienceItem]:
        """Extracts work experience items with full bullet reconstruction (no dropped bullets or sentences)."""
        experiences: List[ExperienceItem] = []
        current_exp: Optional[ExperienceItem] = None

        date_pattern = re.compile(
            r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|\d{1,2}\/\d{4})\s*(?:-|–|—|to)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|\d{1,2}\/\d{4}|Present|Current)',
            re.IGNORECASE
        )

        def is_bullet(l: str) -> bool:
            return bool(re.match(r'^[•\-\*\–\—\>\x7f]\s*|^\d+[\.\)]\s*', l))

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            has_bullet = is_bullet(line_str)
            date_match = date_pattern.search(line_str)

            # Detect new job header:
            # - Must not be a bullet item
            # - Has a date range, OR has title/company separator without ending in a period
            # - Avoid false positives on sentences containing " at " (e.g. "Built microservices at scale")
            is_new_header = False
            if not has_bullet:
                if date_match is not None:
                    is_new_header = True
                elif len(line_str.split()) <= 7 and not line_str.endswith('.'):
                    if any(sep in line_str for sep in [" | ", " — ", " – ", " - "]):
                        is_new_header = True
                    elif " at " in line_str.lower():
                        # Only consider " at " if line doesn't start with action verb
                        words = line_str.split()
                        if words and not words[0].lower().endswith(('ed', 'ing')):
                            is_new_header = True

            if is_new_header:
                if current_exp and (current_exp.company or current_exp.position or current_exp.highlights):
                    experiences.append(current_exp)

                current_exp = ExperienceItem()
                if date_match:
                    current_exp.start_date = date_match.group(1).strip()
                    end_str = date_match.group(2).strip()
                    current_exp.end_date = end_str
                    if any(p in end_str.lower() for p in ["present", "current"]):
                        current_exp.current = True
                    line_without_date = date_pattern.sub('', line_str).strip(' -|–—,')
                else:
                    line_without_date = line_str

                # Parse company and position
                for sep in [" | ", " — ", " – ", " - ", " at "]:
                    if sep in line_without_date:
                        parts = [p.strip() for p in line_without_date.split(sep, 1)]
                        current_exp.position = parts[0]
                        current_exp.company = parts[1] if len(parts) > 1 else ""
                        break
                if not current_exp.position:
                    current_exp.position = line_without_date

            elif has_bullet:
                # Explicit bullet start
                clean_bullet = re.sub(r'^[•\-\*\–\—\>\s]+|^\d+[\.\)]\s*', '', line_str).strip()
                if clean_bullet:
                    if current_exp is None:
                        current_exp = ExperienceItem(position="Professional Experience", highlights=[])
                    current_exp.highlights.append(clean_bullet)

            else:
                # Non-bullet line
                if current_exp is None:
                    current_exp = ExperienceItem(position="Professional Experience", highlights=[line_str])
                elif not current_exp.highlights:
                    # Secondary line before bullets: check for company or location or date
                    if date_match and not current_exp.start_date:
                        current_exp.start_date = date_match.group(1).strip()
                        current_exp.end_date = date_match.group(2).strip()
                        if any(p in current_exp.end_date.lower() for p in ["present", "current"]):
                            current_exp.current = True
                    elif not current_exp.company and len(line_str.split()) <= 6 and not line_str.endswith('.'):
                        current_exp.company = line_str
                    elif not current_exp.location and any(c in line_str for c in [",", "USA", "UK", "Remote", "CA", "NY"]):
                        current_exp.location = line_str
                    else:
                        current_exp.highlights.append(line_str)
                else:
                    # Highlights already exist in current_exp
                    last_highlight = current_exp.highlights[-1]
                    # Continuation check: does line start with lowercase or did previous highlight end without terminal punctuation?
                    is_continuation = (
                        line_str[0].islower() or
                        (not last_highlight.endswith(('.', '!', '?')) and len(line_str.split()) <= 12)
                    )
                    if is_continuation:
                        current_exp.highlights[-1] = f"{last_highlight} {line_str}".strip()
                    else:
                        # Separate unbulleted achievement sentence
                        current_exp.highlights.append(line_str)

        if current_exp and (current_exp.company or current_exp.position or current_exp.highlights):
            experiences.append(current_exp)

        return experiences

    @classmethod
    def _extract_projects(cls, lines: List[str]) -> List[ProjectItem]:
        """Extracts complete projects preserving title, tech stack, links, descriptions, and all bullets."""
        projects: List[ProjectItem] = []
        current_proj: Optional[ProjectItem] = None

        def is_bullet(l: str) -> bool:
            return bool(re.match(r'^[•\-\*\–\—\>\x7f]\s*|^\d+[\.\)]\s*', l))

        date_pattern = re.compile(
            r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*(?:-|–|—|to)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|Present|Current)',
            re.IGNORECASE
        )

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            has_bullet = is_bullet(line_str)

            # Check if this line is an explicit tech stack declaration (e.g. "Technologies: React, Node.js, AWS")
            tech_prefix_match = re.match(r'^(?:technologies|tech stack|tools|built with|stack)[:\s]+(.+)$', line_str, re.IGNORECASE)
            if tech_prefix_match and current_proj is not None:
                techs_found = [t.strip() for t in re.split(r'[,\|;•·▪]\s*', tech_prefix_match.group(1)) if t.strip()]
                for t in techs_found:
                    if t not in current_proj.technologies:
                        current_proj.technologies.append(t)
                continue

            # Detect if line is a project header:
            # - Not a bullet
            # - Not ending with period or comma
            # - Contains tech separator e.g. "Project Name | React", "Project Name (Go, Docker)", or URL, or short title
            is_new_header = False
            if not has_bullet and not line_str.endswith('.'):
                if "|" in line_str or re.search(r'\([A-Za-z0-9,\s\.\+#\/-]+\)$', line_str):
                    is_new_header = True
                elif date_pattern.search(line_str) and len(line_str.split()) <= 8:
                    is_new_header = True
                elif current_proj is None:
                    is_new_header = True
                elif len(line_str.split()) <= 6 and (current_proj.highlights or current_proj.description):
                    # Only a new header if it looks like a title (title case / capitalized) and not a bullet
                    if line_str[0].isupper() and not any(w in line_str.lower() for w in ["built", "created", "responsible", "implemented", "engineered", "designed"]):
                        is_new_header = True

            if is_new_header:
                if current_proj and (current_proj.title or current_proj.highlights or current_proj.description):
                    projects.append(current_proj)

                current_proj = ProjectItem()

                # Extract link if present in title line
                url_m = re.search(r'https?:\/\/[^\s\)]+|github\.com\/[^\s\)]+', line_str)
                if url_m:
                    current_proj.link = url_m.group(0)
                    line_str = line_str.replace(current_proj.link, '').strip(' -|–()[]')

                # Extract technologies from parentheses (e.g. "(React, TypeScript, Node.js)")
                paren_m = re.search(r'\(([^)]+)\)', line_str)
                if paren_m:
                    inner = paren_m.group(1).strip()
                    current_proj.technologies = [t.strip() for t in re.split(r'[,\|;]\s*', inner) if t.strip()]
                    line_str = line_str.replace(paren_m.group(0), '').strip(' -|–')

                # Extract technologies from pipe (e.g. "Title | React, Node.js")
                if "|" in line_str:
                    parts = line_str.split("|", 1)
                    current_proj.title = parts[0].strip()
                    if len(parts) > 1 and not current_proj.technologies:
                        current_proj.technologies = [t.strip() for t in re.split(r'[,\|;]\s*', parts[1]) if t.strip()]
                else:
                    clean_title = date_pattern.sub('', line_str).strip(' -|–,')
                    current_proj.title = clean_title or line_str

            elif has_bullet:
                clean_bullet = re.sub(r'^[•\-\*\–\—\>\s]+|^\d+[\.\)]\s*', '', line_str).strip()
                if clean_bullet:
                    if current_proj is None:
                        current_proj = ProjectItem(title="Key Project", highlights=[])
                    current_proj.highlights.append(clean_bullet)

            else:
                # Non-bullet line inside project
                if current_proj is None:
                    current_proj = ProjectItem(title="Key Project", description=line_str)
                elif current_proj.highlights:
                    # Wrapped line of previous bullet or subsequent achievement sentence
                    last_h = current_proj.highlights[-1]
                    if line_str[0].islower() or not last_h.endswith(('.', '!', '?')):
                        current_proj.highlights[-1] = f"{last_h} {line_str}".strip()
                    else:
                        current_proj.highlights.append(line_str)
                else:
                    # Project description paragraph
                    if not current_proj.description:
                        current_proj.description = line_str
                    else:
                        current_proj.description = f"{current_proj.description} {line_str}".strip()

        if current_proj and (current_proj.title or current_proj.highlights or current_proj.description):
            projects.append(current_proj)

        return projects

    @classmethod
    def _extract_education(cls, lines: List[str]) -> List[EducationItem]:
        """Extracts education items including degree, institution, dates, GPA, and highlights."""
        educations: List[EducationItem] = []
        current_edu: Optional[EducationItem] = None

        degree_keywords = [
            "bachelor", "master", "b.s", "b.a", "b.tech", "m.s", "ph.d", "doctorate",
            "associate", "bsc", "msc", "diploma", "degree", "b.e", "m.e", "mba"
        ]
        date_pattern = re.compile(r'(\d{4})\s*(?:-|–|—|to)\s*(\d{4}|Present|Current)', re.IGNORECASE)

        def is_bullet(l: str) -> bool:
            return bool(re.match(r'^[•\-\*\–\—\>\x7f]\s*|^\d+[\.\)]\s*', l))

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            date_match = date_pattern.search(line_str)
            is_degree = any(dk in line_str.lower() for dk in degree_keywords)
            has_bullet = is_bullet(line_str)

            is_edu_header = not has_bullet and (
                date_match or is_degree or (len(line_str.split()) <= 7 and any(c in line_str for c in ["University", "College", "Institute", "School"]))
            )

            if is_edu_header:
                if current_edu and (current_edu.institution or current_edu.degree):
                    educations.append(current_edu)

                current_edu = EducationItem()
                if date_match:
                    current_edu.start_date = date_match.group(1).strip()
                    current_edu.end_date = date_match.group(2).strip()
                    line_without_date = date_pattern.sub('', line_str).strip(' -|–—,')
                else:
                    line_without_date = line_str

                if is_degree:
                    current_edu.degree = line_without_date
                else:
                    current_edu.institution = line_without_date

            else:
                if current_edu is None:
                    current_edu = EducationItem(institution="University")

                clean_text = re.sub(r'^[•\-\*\–\—\>\s]+', '', line_str).strip()

                # Check for GPA
                if "gpa" in clean_text.lower():
                    gpa_m = re.search(r'gpa[:\s]*([0-9\.\/]+(?:\s*out of\s*[0-9\.]+)?|\d\.\d+)', clean_text, re.IGNORECASE)
                    if gpa_m:
                        current_edu.gpa = gpa_m.group(1).strip()

                # Check if this line is degree or field of study
                if not current_edu.degree and is_degree:
                    current_edu.degree = clean_text
                elif not current_edu.institution and any(c in clean_text for c in ["University", "College", "School", "Institute"]):
                    current_edu.institution = clean_text
                elif clean_text:
                    if has_bullet or not current_edu.highlights:
                        current_edu.highlights.append(clean_text)
                    else:
                        # Append wrapped coursework/honors sentence
                        current_edu.highlights[-1] = f"{current_edu.highlights[-1]} {clean_text}".strip()

        if current_edu and (current_edu.institution or current_edu.degree):
            educations.append(current_edu)

        return educations

    @classmethod
    def _extract_certifications(cls, lines: List[str]) -> List[CertificationItem]:
        """Extracts certifications with name and issuer."""
        certs: List[CertificationItem] = []
        for line in lines:
            clean = re.sub(r'^[•\-\*\–\—\>\s]+', '', line).strip()
            if not clean:
                continue
            for sep in [" - ", " – ", " | ", " by "]:
                if sep in clean:
                    parts = clean.split(sep, 1)
                    certs.append(CertificationItem(name=parts[0].strip(), issuer=parts[1].strip()))
                    break
            else:
                certs.append(CertificationItem(name=clean))
        return certs

    @classmethod
    def _extract_languages(cls, lang_lines: List[str], full_text: str) -> List[str]:
        """Extracts spoken languages."""
        languages: List[str] = []
        for line in lang_lines:
            clean = re.sub(r'^[•\-\*\–\—\>\s]+', '', line).strip()
            if not clean:
                continue
            parts = re.split(r'[,\|;]\s*', clean)
            for p in parts:
                p_s = p.strip()
                if p_s and len(p_s) < 30 and p_s not in languages:
                    languages.append(p_s)
        return languages

    @staticmethod
    def _extract_bullets(lines: List[str]) -> List[str]:
        """Extracts bullet lines joining multi-line continuations."""
        bullets: List[str] = []
        for l in lines:
            clean = re.sub(r'^[•\-\*\–\—\>\x7f\s]+|^\d+[\.\)]\s*', '', l).strip()
            if clean:
                if re.match(r'^[•\-\*\–\—\>\x7f]|\d+[\.\)]', l) or not bullets:
                    bullets.append(clean)
                else:
                    bullets[-1] = f"{bullets[-1]} {clean}".strip()
        return bullets

    @classmethod
    def validate_extraction(cls, raw_text: str, profile: ResumeProfile) -> ExtractionValidationResult:
        """
        Validates extracted structured content against the raw text.
        Detects missing sections, dropped bullets, and calculates content coverage.
        """
        raw_lower = raw_text.lower()
        warnings: List[str] = []
        missing_sections: List[str] = []
        detected_sections: List[str] = []

        # 1. Detect which sections were present in raw text by checking header patterns
        section_heading_checks = {
            "work_experience": [
                r'(?:^|\n)\s*(?:#*\s*)?(?:work\s+experience|professional\s+experience|employment\s+history|experience|internships)',
            ],
            "education": [
                r'(?:^|\n)\s*(?:#*\s*)?(?:education|academic\s+background|degrees|academic\s+qualifications)',
            ],
            "projects": [
                r'(?:^|\n)\s*(?:#*\s*)?(?:projects|personal\s+projects|technical\s+projects|academic\s+projects|portfolio)',
            ],
            "skills": [
                r'(?:^|\n)\s*(?:#*\s*)?(?:skills|technical\s+skills|core\s+competencies|technologies|tech\s+stack)',
            ],
            "certifications": [
                r'(?:^|\n)\s*(?:#*\s*)?(?:certifications|certificates|licenses|courses)',
            ]
        }

        for sec_name, patterns in section_heading_checks.items():
            if any(re.search(pat, raw_lower) for pat in patterns):
                detected_sections.append(sec_name)

        # 2. Check if detected sections exist in profile
        if "work_experience" in detected_sections and not profile.work_experience:
            missing_sections.append("work_experience")
            warnings.append("Raw resume contains work experience, but no structured jobs were extracted.")

        if "education" in detected_sections and not profile.education:
            missing_sections.append("education")
            warnings.append("Raw resume contains education, but no structured education items were extracted.")

        if "projects" in detected_sections and not profile.projects:
            missing_sections.append("projects")
            warnings.append("Raw resume contains projects, but no structured projects were extracted.")

        if "skills" in detected_sections:
            total_skills = (
                len(profile.skills.technical_skills) +
                len(profile.skills.frameworks_libraries) +
                len(profile.skills.developer_tools) +
                len(profile.skills.other)
            )
            if total_skills == 0:
                missing_sections.append("skills")
                warnings.append("Raw resume contains a skills section, but no skills were extracted.")

        # 3. Bullet count comparison
        raw_bullet_matches = re.findall(r'(?:^[•\-\*\–\—\>]|^\d+[\.\)]|\n[•\-\*\–\—\>]|\n\d+[\.\)])\s*\S+', raw_text)
        raw_bullet_count = len(raw_bullet_matches)

        extracted_bullets_count = 0
        for exp in profile.work_experience:
            extracted_bullets_count += len(exp.highlights)
        for proj in profile.projects:
            extracted_bullets_count += len(proj.highlights)
            if proj.description:
                extracted_bullets_count += 1
        for edu in profile.education:
            extracted_bullets_count += len(edu.highlights)
        extracted_bullets_count += len(profile.achievements)
        extracted_bullets_count += len(profile.extracurriculars)

        if raw_bullet_count > 0 and extracted_bullets_count < (raw_bullet_count * 0.7):
            warnings.append(f"Raw resume has {raw_bullet_count} bullets, but only {extracted_bullets_count} items were structured.")

        # 4. Compute coverage score
        coverage = 100
        if missing_sections:
            coverage -= (len(missing_sections) * 20)
        if raw_bullet_count > 0 and extracted_bullets_count < raw_bullet_count:
            bullet_ratio = extracted_bullets_count / max(raw_bullet_count, 1)
            coverage = int(coverage * (0.6 + 0.4 * min(bullet_ratio, 1.0)))

        coverage = max(10, min(100, coverage))
        is_complete = len(missing_sections) == 0 and coverage >= 80

        stats = {
            "raw_text_length": len(raw_text),
            "raw_bullet_count": raw_bullet_count,
            "extracted_bullets_count": extracted_bullets_count,
            "experience_count": len(profile.work_experience),
            "projects_count": len(profile.projects),
            "education_count": len(profile.education),
            "skills_count": (
                len(profile.skills.technical_skills) +
                len(profile.skills.frameworks_libraries) +
                len(profile.skills.developer_tools) +
                len(profile.skills.other)
            ),
        }

        return ExtractionValidationResult(
            is_complete=is_complete,
            is_valid=is_complete,
            coverage_score=coverage,
            missing_sections=missing_sections,
            warnings=warnings,
            detected_sections=detected_sections,
            stats=stats
        )
