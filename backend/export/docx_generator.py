import io
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from models.schemas import ResumeProfile, TemplateCustomization


HEX_COLOR_MAP = {
    "#2563EB": (37, 99, 235),    # Blue
    "#059669": (5, 150, 105),    # Emerald
    "#7C3AED": (124, 58, 237),   # Purple
    "#DC2626": (220, 38, 38),    # Red
    "#D97706": (217, 119, 6),    # Amber
    "#0F172A": (15, 23, 42),     # Dark Slate
}


class DocxResumeGenerator:
    """
    Generates high-quality, ATS-compliant Microsoft Word (.docx) documents from Resume Profiles.
    """

    @classmethod
    def generate_docx(cls, profile: ResumeProfile, customization: TemplateCustomization = None) -> io.BytesIO:
        customization = customization or TemplateCustomization()
        doc = Document()

        # Set Margins (default 0.65 in)
        sections = doc.sections
        for section in sections:
            section.top_margin = Inches(0.6)
            section.bottom_margin = Inches(0.6)
            section.left_margin = Inches(0.65)
            section.right_margin = Inches(0.65)

        accent_rgb = HEX_COLOR_MAP.get(customization.accent_color, (37, 99, 235))
        accent_color = RGBColor(*accent_rgb)
        font_name = customization.font_family or "Calibri"

        # 1. Header: Name & Title
        title_para = doc.add_paragraph()
        title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_run = title_para.add_run(profile.contact_info.full_name or "Professional Resume")
        title_run.font.name = font_name
        title_run.font.size = Pt(22)
        title_run.font.bold = True
        title_run.font.color.rgb = accent_color

        if profile.contact_info.title:
            sub_para = doc.add_paragraph()
            sub_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            sub_run = sub_para.add_run(profile.contact_info.title)
            sub_run.font.name = font_name
            sub_run.font.size = Pt(12)
            sub_run.font.bold = True
            sub_run.font.color.rgb = RGBColor(100, 116, 139)

        # Contact Links line
        contact_parts = []
        if profile.contact_info.email: contact_parts.append(profile.contact_info.email)
        if profile.contact_info.phone: contact_parts.append(profile.contact_info.phone)
        if profile.contact_info.location: contact_parts.append(profile.contact_info.location)
        if profile.contact_info.linkedin: contact_parts.append(profile.contact_info.linkedin)
        if profile.contact_info.github: contact_parts.append(profile.contact_info.github)

        if contact_parts:
            contact_para = doc.add_paragraph()
            contact_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            contact_run = contact_para.add_run(" • ".join(contact_parts))
            contact_run.font.name = font_name
            contact_run.font.size = Pt(9.5)
            contact_run.font.color.rgb = RGBColor(71, 85, 105)

        cls._add_divider(doc)

        # 2. Professional Summary
        if profile.summary:
            cls._add_section_heading(doc, "PROFESSIONAL SUMMARY", font_name, accent_color)
            p = doc.add_paragraph()
            r = p.add_run(profile.summary)
            r.font.name = font_name
            r.font.size = Pt(10)

        # 3. Work Experience
        if profile.work_experience:
            cls._add_section_heading(doc, "WORK EXPERIENCE", font_name, accent_color)
            for exp in profile.work_experience:
                exp_header = doc.add_paragraph()
                r_pos = exp_header.add_run(exp.position)
                r_pos.font.name = font_name
                r_pos.font.bold = True
                r_pos.font.size = Pt(10.5)
                
                if exp.company:
                    r_comp = exp_header.add_run(f" | {exp.company}")
                    r_comp.font.name = font_name
                    r_comp.font.size = Pt(10.5)
                    r_comp.font.color.rgb = RGBColor(71, 85, 105)

                dates = f"{exp.start_date} – {exp.end_date or ('Present' if exp.current else '')}"
                if dates.strip(" –"):
                    r_date = exp_header.add_run(f"   ({dates})")
                    r_date.font.name = font_name
                    r_date.font.italic = True
                    r_date.font.size = Pt(9.5)
                    r_date.font.color.rgb = RGBColor(100, 116, 139)

                for highlight in exp.highlights:
                    bp = doc.add_paragraph(style='List Bullet')
                    r_b = bp.add_run(highlight)
                    r_b.font.name = font_name
                    r_b.font.size = Pt(9.5)

        # 4. Key Projects
        if profile.projects:
            cls._add_section_heading(doc, "KEY PROJECTS", font_name, accent_color)
            for proj in profile.projects:
                proj_p = doc.add_paragraph()
                r_title = proj_p.add_run(proj.title)
                r_title.font.name = font_name
                r_title.font.bold = True
                r_title.font.size = Pt(10.5)
                
                if proj.technologies:
                    r_tech = proj_p.add_run(f" | {', '.join(proj.technologies)}")
                    r_tech.font.name = font_name
                    r_tech.font.size = Pt(9.5)
                    r_tech.font.color.rgb = RGBColor(100, 116, 139)

                if proj.description:
                    dp = doc.add_paragraph()
                    r_desc = dp.add_run(proj.description)
                    r_desc.font.name = font_name
                    r_desc.font.size = Pt(9.5)

                for highlight in proj.highlights:
                    bp = doc.add_paragraph(style='List Bullet')
                    r_b = bp.add_run(highlight)
                    r_b.font.name = font_name
                    r_b.font.size = Pt(9.5)

        # 5. Technical Skills
        all_skills = profile.skills
        skill_lines = []
        if all_skills.technical_skills:
            skill_lines.append(("Languages & Core", ", ".join(all_skills.technical_skills)))
        if all_skills.frameworks_libraries:
            skill_lines.append(("Frameworks & Libraries", ", ".join(all_skills.frameworks_libraries)))
        if all_skills.developer_tools:
            skill_lines.append(("Cloud & Developer Tools", ", ".join(all_skills.developer_tools)))
        if all_skills.soft_skills:
            skill_lines.append(("Leadership & Soft Skills", ", ".join(all_skills.soft_skills)))

        if skill_lines:
            cls._add_section_heading(doc, "SKILLS & EXPERTISE", font_name, accent_color)
            for label, items in skill_lines:
                sp = doc.add_paragraph()
                r_lbl = sp.add_run(f"{label}: ")
                r_lbl.font.name = font_name
                r_lbl.font.bold = True
                r_lbl.font.size = Pt(9.5)
                r_items = sp.add_run(items)
                r_items.font.name = font_name
                r_items.font.size = Pt(9.5)

        # 6. Education
        if profile.education:
            cls._add_section_heading(doc, "EDUCATION", font_name, accent_color)
            for edu in profile.education:
                ed_p = doc.add_paragraph()
                r_deg = ed_p.add_run(edu.degree)
                r_deg.font.name = font_name
                r_deg.font.bold = True
                r_deg.font.size = Pt(10)
                
                if edu.institution:
                    r_inst = ed_p.add_run(f" | {edu.institution}")
                    r_inst.font.name = font_name
                    r_inst.font.size = Pt(10)

                dates = f"{edu.start_date} – {edu.end_date}" if edu.start_date and edu.end_date else edu.end_date
                if dates:
                    r_date = ed_p.add_run(f"   ({dates})")
                    r_date.font.name = font_name
                    r_date.font.italic = True
                    r_date.font.size = Pt(9)
                    r_date.font.color.rgb = RGBColor(100, 116, 139)

        # 7. Certifications & Achievements
        if profile.certifications or profile.achievements:
            cls._add_section_heading(doc, "CERTIFICATIONS & AWARDS", font_name, accent_color)
            for cert in profile.certifications:
                cp = doc.add_paragraph(style='List Bullet')
                r_c = cp.add_run(f"{cert.name}{' - ' + cert.issuer if cert.issuer else ''}")
                r_c.font.name = font_name
                r_c.font.size = Pt(9.5)
            for ach in profile.achievements:
                ap = doc.add_paragraph(style='List Bullet')
                r_a = ap.add_run(ach)
                r_a.font.name = font_name
                r_a.font.size = Pt(9.5)

        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        return buffer

    @staticmethod
    def _add_section_heading(doc: Document, title: str, font_name: str, color: RGBColor):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(title)
        run.font.name = font_name
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = color

    @staticmethod
    def _add_divider(doc: Document):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(6)
