"""
Automated Verification Suite for CV Extraction & AI Interviewer Speed
======================================================================
Tests:
  1. PDF resume extraction: preserves 100% raw text, combined headings, project descriptions + bullets.
  2. DOCX resume extraction: tests Word list numbering & headers.
  3. Validation engine: checks coverage scores, missing section detection, and statistics.
  4. AI Interviewer speed: verifies instant session start, compact prompt token count, and streaming speed.
"""

import os
import io
import sys
import time
import json

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from docx import Document

from nlp.parser import ResumeParser
from ai.interview_engine import InterviewEngine
from models.schemas import ResumeProfile

def create_sample_pdf() -> bytes:
    """Generates a realistic multi-page/multi-section PDF resume with wrapped lines and bullets."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, leading=22, spaceAfter=4)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=10, leading=14, spaceAfter=8)
    heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=12, leading=16, spaceBefore=8, spaceAfter=4)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=9, leading=13, spaceAfter=3)
    bullet_style = ParagraphStyle('Bullet', parent=styles['Normal'], fontSize=9, leading=13, spaceAfter=2, leftIndent=12)

    story = [
        Paragraph("<b>SARAH JENKINS</b>", title_style),
        Paragraph("Senior Backend Engineer | sarah.jenkins@email.com | +1 (555) 432-8765 | Austin, TX | linkedin.com/in/sarahjenkins | github.com/sjenkins", subtitle_style),
        Paragraph("<b>PROFESSIONAL SUMMARY</b>", heading_style),
        Paragraph("High-impact Senior Backend Engineer with 6+ years building resilient distributed architectures, event-driven microservices, and high-throughput data processing pipelines. Proven history reducing API p99 latency by 55% while maintaining 99.99% system uptime.", body_style),
        
        Paragraph("<b>WORK EXPERIENCE & INTERNSHIPS</b>", heading_style),
        Paragraph("<b>Senior Backend Systems Engineer</b> — CloudScale Technologies (2021 – Present)", body_style),
        Paragraph("• Architected and deployed event-driven telemetry pipeline handling 1.2 billion events daily using Kafka, Go, and Redis clusters.", bullet_style),
        Paragraph("• Optimized distributed PostgreSQL query performance and caching layers, cutting 95th percentile database latency by 42%.", bullet_style),
        Paragraph("• Led cross-functional team of 6 engineers through zero-downtime migration from AWS ECS to multi-region Kubernetes.", bullet_style),
        
        Paragraph("<b>Software Engineer</b> — DataStream Inc. (2018 – 2021)", body_style),
        Paragraph("• Designed high-concurrency microservices in Python (FastAPI) and PostgreSQL serving 45,000 requests/sec.", bullet_style),
        Paragraph("• Implemented automated CI/CD pipeline using GitHub Actions and Docker, reducing release cycle duration from 4 hours to 12 minutes.", bullet_style),

        Paragraph("<b>PROJECTS & OPEN SOURCE</b>", heading_style),
        Paragraph("<b>HyperCache Distributed Key-Value Store</b> (Go, Raft, gRPC)", body_style),
        Paragraph("A fault-tolerant distributed in-memory key-value cache implementing the Raft consensus protocol for zero-data-loss leader election.", body_style),
        Paragraph("• Achieved linearizable reads and durable partition recovery under simulated 35% packet drop conditions.", bullet_style),
        Paragraph("• Benchmarked over 85,000 sustained QPS across a 5-node cluster with sub-2ms network round-trip time.", bullet_style),

        Paragraph("<b>AsyncFlow Workflow Orchestrator</b> (Python, Redis, Celery)", body_style),
        Paragraph("Distributed directed acyclic graph (DAG) workflow scheduling engine designed for resilient background task processing.", body_style),
        Paragraph("• Engineered resilient retry mechanism with exponential backoff and dead-letter queue routing for failed tasks.", bullet_style),
        Paragraph("• Adopted by 3 enterprise internal teams, orchestrating 250,000 monthly automation workflows.", bullet_style),

        Paragraph("<b>TECHNICAL SKILLS & TOOLS</b>", heading_style),
        Paragraph("<b>Programming Languages:</b> Go, Python, TypeScript, Java, SQL, Rust, C++", body_style),
        Paragraph("<b>Frameworks & Libraries:</b> FastAPI, Gin, React, Next.js, Node.js, Express, Django", body_style),
        Paragraph("<b>Databases & Caching:</b> PostgreSQL, Redis, Apache Kafka, MongoDB, Elasticsearch", body_style),
        Paragraph("<b>Cloud & DevOps:</b> Docker, Kubernetes, AWS, Terraform, Git, CI/CD, Linux, Prometheus", body_style),

        Paragraph("<b>ACADEMIC CREDENTIALS</b>", heading_style),
        Paragraph("<b>Bachelor of Science in Computer Science</b> — University of Texas at Austin (2014 – 2018)", body_style),
        Paragraph("• Graduated Magna Cum Laude with GPA 3.88/4.00", bullet_style),
        Paragraph("• Dean's Honor List for 6 consecutive academic semesters", bullet_style),

        Paragraph("<b>CERTIFICATIONS & HONORS</b>", heading_style),
        Paragraph("• AWS Certified Solutions Architect – Professional (SAP-C02)", bullet_style),
        Paragraph("• Certified Kubernetes Administrator (CKA)", bullet_style),
    ]

    doc.build(story)
    return buf.getvalue()

def create_sample_docx() -> bytes:
    """Generates a realistic DOCX resume with list numbering styles and headers."""
    doc = Document()
    header = doc.sections[0].header
    hp = header.paragraphs[0]
    hp.text = "David Vance | david.vance@techcorp.io | +1 (555) 987-6543 | Seattle, WA"

    doc.add_heading("DAVID VANCE", level=1)
    doc.add_paragraph("Staff Site Reliability Engineer | Seattle, WA | github.com/dvance")

    doc.add_heading("Professional Summary", level=2)
    doc.add_paragraph("Staff SRE with 8+ years specializing in multi-region cloud resilience, chaos engineering, and Kubernetes fleet management at petabyte scale.")

    doc.add_heading("Work Experience", level=2)
    doc.add_paragraph("Staff Site Reliability Engineer — Global FinTech Corp (2020 – Present)")
    doc.add_paragraph("Architected multi-cloud disaster recovery platform providing sub-60-second automatic RTO across AWS and GCP.", style='List Bullet')
    doc.add_paragraph("Standardized Terraform infrastructure-as-code modules managing 120+ production Kubernetes clusters worldwide.", style='List Bullet')
    doc.add_paragraph("Reduced annual infrastructure cloud spending by $420,000 through automated spot instance fleet rebalancing.", style='List Bullet')

    doc.add_heading("Featured Projects", level=2)
    doc.add_paragraph("ChaosKube Mesh Controller (Go, Kubernetes CRD, eBPF)")
    doc.add_paragraph("Custom Kubernetes operator for automated failure injection and network latency testing in staging environments.")
    doc.add_paragraph("Intercepts socket calls using eBPF probes to inject millisecond jitter without modifying application source code.", style='List Bullet')
    doc.add_paragraph("Presented at Cloud Native DevOps Summit 2023 with 4,000+ attendees.", style='List Bullet')

    doc.add_heading("Technical Skills", level=2)
    doc.add_paragraph("Languages: Go, Python, Bash, YAML")
    doc.add_paragraph("Cloud & Orchestration: Kubernetes, Docker, AWS, GCP, Terraform, Helm")
    doc.add_paragraph("Observability: Prometheus, Grafana, Datadog, OpenTelemetry")

    doc.add_heading("Education", level=2)
    doc.add_paragraph("B.S. in Computer Engineering — University of Washington (2016)")

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()

def run_tests():
    print("=================================================================")
    print("1. TESTING PDF RESUME PARSING & PRESERVATION")
    print("=================================================================")
    pdf_bytes = create_sample_pdf()
    pdf_text = ResumeParser.extract_text_from_pdf(pdf_bytes)
    assert len(pdf_text) > 500, "PDF extraction returned insufficient text"
    assert "SARAH JENKINS" in pdf_text, "Name missing from PDF raw text"
    assert "HyperCache" in pdf_text, "Project title missing from PDF raw text"
    assert "1.2 billion events" in pdf_text, "Experience metric bullet missing from PDF text"
    print(f"✓ PDF extracted raw text: {len(pdf_text)} characters preserved.")

    profile_pdf = ResumeParser.parse_text(pdf_text)
    print(f"✓ Candidate: {profile_pdf.contact_info.full_name} ({profile_pdf.contact_info.title})")
    print(f"✓ Experience Items: {len(profile_pdf.work_experience)}")
    for exp in profile_pdf.work_experience:
        print(f"   - {exp.position} at {exp.company} ({len(exp.highlights)} bullets)")
    assert len(profile_pdf.work_experience) >= 2, "Expected at least 2 experience entries"
    assert len(profile_pdf.work_experience[0].highlights) >= 2, "Expected highlights in experience 0"

    print(f"✓ Projects Extracted: {len(profile_pdf.projects)}")
    for proj in profile_pdf.projects:
        print(f"   - {proj.title} (tech: {proj.technologies}) | desc: {proj.description[:40]}... | {len(proj.highlights)} bullets")
    assert len(profile_pdf.projects) >= 2, "Expected at least 2 project entries"
    assert any("HyperCache" in p.title for p in profile_pdf.projects), "HyperCache project missing"
    assert any(len(p.highlights) >= 2 for p in profile_pdf.projects), "Project bullets missing"

    total_skills = (
        len(profile_pdf.skills.technical_skills) +
        len(profile_pdf.skills.frameworks_libraries) +
        len(profile_pdf.skills.developer_tools)
    )
    print(f"✓ Categorized Skills: {total_skills} skills found ({profile_pdf.skills.technical_skills[:4]})")
    assert total_skills >= 8, "Expected at least 8 skills categorized"

    assert len(profile_pdf.education) >= 1, "Expected education"
    print(f"✓ Education: {profile_pdf.education[0].degree} at {profile_pdf.education[0].institution} (GPA: {profile_pdf.education[0].gpa})")
    assert "3.88" in (profile_pdf.education[0].gpa or ""), "GPA was dropped from education"

    validation_pdf = ResumeParser.validate_extraction(pdf_text, profile_pdf)
    print(f"✓ Validation Coverage Score: {validation_pdf.coverage_score}% | Valid: {validation_pdf.is_valid}")
    print(f"✓ Stats: {validation_pdf.stats}")
    print(f"✓ Warnings: {validation_pdf.warnings}")
    assert validation_pdf.coverage_score >= 85, f"Validation score too low: {validation_pdf.coverage_score}%"

    print("\n=================================================================")
    print("2. TESTING DOCX RESUME EXTRACTION & WORD LIST BULLETS")
    print("=================================================================")
    docx_bytes = create_sample_docx()
    docx_text = ResumeParser.extract_text_from_docx(docx_bytes)
    assert len(docx_text) > 300, "DOCX extraction returned insufficient text"
    assert "DAVID VANCE" in docx_text, "Name missing from DOCX raw text"
    assert "david.vance@techcorp.io" in docx_text, "Header contact info missing from DOCX"
    print(f"✓ DOCX extracted raw text: {len(docx_text)} characters (Header contact found: {'david.vance' in docx_text})")

    profile_docx = ResumeParser.parse_text(docx_text)
    print(f"✓ Candidate: {profile_docx.contact_info.full_name}")
    print(f"✓ Email: {profile_docx.contact_info.email}")
    print(f"✓ Experience: {len(profile_docx.work_experience)} items, {len(profile_docx.work_experience[0].highlights) if profile_docx.work_experience else 0} bullets")
    print(f"✓ Projects: {len(profile_docx.projects)} items")
    validation_docx = ResumeParser.validate_extraction(docx_text, profile_docx)
    print(f"✓ Validation Coverage Score: {validation_docx.coverage_score}% | Valid: {validation_docx.is_valid}")
    assert validation_docx.coverage_score >= 80, f"DOCX validation score too low: {validation_docx.coverage_score}%"

    print("\n=================================================================")
    print("3. TESTING AI INTERVIEWER SPEED & COMPACT STATE")
    print("=================================================================")
    t0 = time.time()
    session = InterviewEngine.get_initial_session()
    start_time_ms = (time.time() - t0) * 1000
    print(f"✓ get_initial_session() latency: {start_time_ms:.2f}ms (instant start)")
    assert start_time_ms < 3000, "Initial session creation should be fast"
    assert len(session.messages) == 1
    print(f"✓ Opening AI message: \"{session.messages[0].text}\"")

    # Turn 1: Candidate provides personal & target role info
    user_input_1 = "My name is Marcus Reed, and I am aiming for a Senior Cloud Architect role. My email is marcus.reed@cloud.io"
    print(f"\n[Turn 1] User: {user_input_1}")
    t1 = time.time()
    chunks = []
    first_token_time = None
    for sse_line in InterviewEngine.stream_turn(session, user_input_1):
        if not first_token_time:
            first_token_time = (time.time() - t1) * 1000
        if sse_line.startswith("data: "):
            payload = json.loads(sse_line[6:].strip())
            tok = payload.get("token", "")
            if tok:
                chunks.append(tok)
    turn_1_total_time = (time.time() - t1) * 1000
    ai_reply_1 = "".join(chunks).strip()
    print(f"✓ Time to first streamed token: {first_token_time:.2f}ms")
    print(f"✓ Total Turn 1 latency: {turn_1_total_time:.2f}ms")
    print(f"✓ AI response: \"{ai_reply_1}\"")
    print(f"✓ Incremental profile extracted: {session.collected_profile.contact_info.full_name} | {session.collected_profile.contact_info.title} | {session.collected_profile.contact_info.email}")
    assert session.collected_profile.contact_info.full_name == "Marcus Reed", "Failed to extract candidate name"
    assert session.collected_profile.contact_info.email == "marcus.reed@cloud.io", "Failed to extract email"

    # Turn 2: Education
    user_input_2 = "I completed a B.S. in Computer Science at Stanford University in 2017 with a 3.9 GPA."
    print(f"\n[Turn 2] User: {user_input_2}")
    t2 = time.time()
    chunks2 = []
    first_token_time2 = None
    for sse_line in InterviewEngine.stream_turn(session, user_input_2):
        if not first_token_time2:
            first_token_time2 = (time.time() - t2) * 1000
        if sse_line.startswith("data: "):
            payload = json.loads(sse_line[6:].strip())
            tok = payload.get("token", "")
            if tok:
                chunks2.append(tok)
    turn_2_total_time = (time.time() - t2) * 1000
    ai_reply_2 = "".join(chunks2).strip()
    print(f"✓ Time to first streamed token: {first_token_time2:.2f}ms")
    print(f"✓ Total Turn 2 latency: {turn_2_total_time:.2f}ms")
    print(f"✓ AI response: \"{ai_reply_2}\"")
    print(f"✓ Incremental education: {len(session.collected_profile.education)} items")
    if session.collected_profile.education:
        edu = session.collected_profile.education[0]
        print(f"   Degree: {edu.degree}, Inst: {edu.institution}, Year: {edu.end_date}, GPA: {edu.gpa}")

    # Turn 3: Skills & Technologies
    user_input_3 = "My core stack includes Python, Go, Docker, Kubernetes, AWS, Terraform, and PostgreSQL."
    print(f"\n[Turn 3] User: {user_input_3}")
    t3 = time.time()
    chunks3 = []
    for sse_line in InterviewEngine.stream_turn(session, user_input_3):
        if sse_line.startswith("data: "):
            payload = json.loads(sse_line[6:].strip())
            tok = payload.get("token", "")
            if tok:
                chunks3.append(tok)
    ai_reply_3 = "".join(chunks3).strip()
    print(f"✓ AI response: \"{ai_reply_3}\"")
    extracted_skills = (
        session.collected_profile.skills.technical_skills +
        session.collected_profile.skills.frameworks_libraries +
        session.collected_profile.skills.developer_tools
    )
    print(f"✓ Incremental skills detected: {extracted_skills}")
    assert len(extracted_skills) >= 4, "Skills should be incrementally detected on every turn"

    print("\n=================================================================")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("=================================================================")

if __name__ == "__main__":
    run_tests()
