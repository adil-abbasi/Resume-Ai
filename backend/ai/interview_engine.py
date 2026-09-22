"""
Intelligent AI Career Interview Engine — Powered by Groq LPU Ultra-Fast Inference
==================================================================================
Executive career coach and technical recruiter AI engine that conducts dynamic,
professional resume interviews using STAR methodology (Situation, Task, Action, Result)
and real-time ATS resume extraction.

Key Capabilities:
  - Instant <400ms time-to-first-token streaming via Groq LPU inference.
  - Conversational context memory: maintains multi-turn history for coherent dialogue.
  - STAR Framework: probes for technical depth, architectural challenges, and metrics.
  - Dual-Layer Real-Time Extraction:
      Layer 1: Deterministic fast NLP parsing for instant 0ms field capture.
      Layer 2: LLM JSON extraction to polish raw candidate answers into ATS-optimized
               action-verb bullets, dynamic executive summary, and categorized skills.
  - Non-linear flow: adapts gracefully to career pivots, new grads, executive backgrounds,
    and user commands ("skip to skills", "add another job", "review my summary").
  - Clean UTF-8 streaming without character glitches.
"""

import re
import json
import logging
from typing import List, Dict, Any, Optional, Generator

from models.schemas import (
    ResumeProfile, ContactInfo, ExperienceItem, EducationItem,
    ProjectItem, CertificationItem, SkillsGroup, InterviewSessionState, InterviewMessage
)
from nlp.skill_database import ALL_SKILLS_MAP
from ai.llm_provider import provider as get_llm, sanitize_text

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Section Flow & Guidelines
# ---------------------------------------------------------------------------

FLOW_SECTIONS = [
    "personal",
    "experience",
    "projects",
    "skills",
    "education",
    "certifications",
    "summary"
]

ADIL_AI_SYSTEM_PROMPT = """You are "Adil's AI", an elite conversational AI voice interviewer and executive career advisor.
Your mission is to conduct a natural, engaging, professional voice conversation to discover the candidate's background and build an exceptional ATS-optimized resume.

MULTILINGUAL NATURAL CONVERSATION:
1. You understand and fluently comprehend:
   - English
   - Urdu (اردو)
   - Hindi (हिन्दी)
   - Mixed Roman Urdu / Hinglish (e.g., "Main Sukkur IBA mein Computer Science kar raha hoon", "Maine ek AI project banaya tha using Python", "I completed my internship last month and worked on telemetry data")
2. The user can speak naturally without selecting a language first.
3. Understand the meaning, extract the correct facts, and format them into professional English resume fields.
4. Respond naturally in warm, friendly language matching the candidate's conversational comfort (clean English or natural mixed language).

NATURAL VOICE CONVERSATIONAL PRINCIPLES:
1. Speak like an experienced, supportive, articulate human career coach having a phone or voice conversation.
2. Keep spoken responses concise and conversational: exactly 1-2 short sentences (maximum 35 words).
3. Do NOT make responses robotic. Avoid: "Thank you for your response. Now I will ask you another question."
   Instead, acknowledge briefly and naturally, then ask ONE natural follow-up:
   "Got it. What technologies did you use for that project?"
   "Great. What was your role there, and what kind of work did you handle?"
4. NEVER repeat robotic checklist parentheticals like "(e.g., cost savings, latency, throughput, revenue)". Ask questions naturally in plain spoken language.
5. Avoid asking multiple long questions at once. Ask only ONE focused follow-up question per turn.

INTELLIGENT DYNAMIC INTERVIEW (NO FIXED QUESTION LIST):
Dynamically decide what to ask next based on the user's previous answers:
- If user mentions an internship or job: Ask about their role, responsibilities, and key achievements.
- If user mentions an AI or software project: Ask what they personally built or contributed to in that project and the tech stack.
- If user mentions education: Ask about their degree, university, graduation year, or key academic focus.
- If user mentions skills/tools: Ask how they applied them in practical projects.
- Cover all applicable sections dynamically: Name, target role, career objective, education (university, degree, graduation info), work experience, internships, job titles, responsibilities, projects, technologies, skills, certifications, achievements, awards, publications, languages, extracurriculars, and career interests.
- Do NOT unnecessarily ask questions for sections that are irrelevant.

STRICT ZERO FABRICATION (CRITICAL RULE):
- NEVER invent, assume, or fabricate any jobs, companies, responsibilities, metrics, achievements, skills, certifications, projects, education, percentages, revenue, users, or performance improvements.
- If an important detail or metric is missing, ask the user directly:
  "Did your work result in any measurable improvement? If yes, what was the actual figure?"

COMPLETION DETECTION:
- Check whether the resume has sufficient information across education, projects/experience, and core skills for a strong ATS resume.
- When sufficient information has been collected or the user asks to finish, conclude with:
  "Great, Adil. I have enough information to build your resume. I'm going to finalise everything now. [INTERVIEW_COMPLETE]"
- NEVER output <think> tags, internal reasoning, or robotic checklists."""


FALLBACK_FLOW_STEPS = [
    {
        "step": "education",
        "intro": "Hi Adil, I'm Adil's AI. I'll help you build your resume by having a short conversation with you. I'll ask about your education, experience, projects, skills and achievements. You can answer naturally, and I'll turn everything into your professional resume. Let's start. Tell me about your education.",
    },
    {
        "step": "experience",
        "intro": "Great. What work experience or internships have you completed? Please share your company, role, and key responsibilities.",
    },
    {
        "step": "experience_followup",
        "intro": "What was your key contribution in that role, and did your work lead to any specific measurable results?",
    },
    {
        "step": "projects",
        "intro": "Tell me about a technical project you built. What did you personally build, and what technologies did you use?",
    },
    {
        "step": "skills",
        "intro": "What are your core technical skills, programming languages, and developer tools?",
    },
    {
        "step": "certifications",
        "intro": "Do you have any certifications, awards, or spoken languages you'd like to highlight?",
    },
]


# ---------------------------------------------------------------------------
# InterviewEngine Class
# ---------------------------------------------------------------------------

class InterviewEngine:
    """
    Intelligent Conversational Career Interview Engine — Adil's AI.
    """

    # ---- Session Init (Instant 0ms start) ----

    @classmethod
    def get_initial_session(cls, target_role: Optional[str] = None) -> InterviewSessionState:
        """Create a fresh interview session with immediate welcoming message from Adil's AI."""
        llm = get_llm()
        ai_mode = "llm" if llm.is_available() else "fallback"

        opening_text = (
            "Hi Adil, I'm Adil's AI. I'll help you build your resume by having a short conversation with you. "
            "I'll ask about your education, experience, projects, skills and achievements. "
            "You can answer naturally, and I'll turn everything into your professional resume. "
            "Let's start. Tell me about your education."
        )

        initial_msg = InterviewMessage(sender="ai", text=opening_text)
        initial_profile = ResumeProfile(id="interview-resume", title="Adil's AI Resume")
        if target_role:
            initial_profile.target_role = target_role
            initial_profile.contact_info.title = target_role

        session = InterviewSessionState(
            current_step=f"education|{ai_mode}",
            question_index=0,
            collected_profile=initial_profile,
            messages=[initial_msg],
            is_complete=False,
            last_updated_section=None,
        )
        return session

    # ---- Context & State Helpers ----

    @classmethod
    def _build_candidate_status(cls, profile: ResumeProfile) -> str:
        """Generates a concise status summary of collected resume facts."""
        facts: List[str] = []
        if profile.contact_info.full_name:
            role = profile.contact_info.title or profile.target_role or "Professional"
            facts.append(f"Name: {profile.contact_info.full_name} | Target Role: {role}")
        if profile.contact_info.email:
            facts.append(f"Contact: {profile.contact_info.email}")
        if profile.work_experience:
            roles_desc = [f"{e.position} at {e.company} ({len(e.highlights)} bullets)" for e in profile.work_experience if e.company or e.position]
            facts.append(f"Experience: {', '.join(roles_desc)}")
        if profile.projects:
            p_desc = [p.title for p in profile.projects if p.title]
            facts.append(f"Projects: {', '.join(p_desc)}")
        all_skills = (
            profile.skills.technical_skills[:5] +
            profile.skills.frameworks_libraries[:4] +
            profile.skills.developer_tools[:3]
        )
        if all_skills:
            facts.append(f"Skills: {', '.join(all_skills)}")
        if profile.education:
            edus = [f"{ed.degree} from {ed.institution}".strip() for ed in profile.education if ed.degree or ed.institution]
            facts.append(f"Education: {', '.join(edus)}")
        if profile.summary:
            facts.append(f"Current Summary: {profile.summary}")

        return "\n".join(facts) if facts else "No data collected yet."

    @classmethod
    def _determine_focus_section(cls, session: InterviewSessionState) -> str:
        """Determines the current strategic focus section based on resume completeness."""
        profile = session.collected_profile
        user_msgs = [m for m in session.messages if m.sender == "user"]
        total_user_turns = len(user_msgs)

        if not profile.contact_info.full_name or not (profile.contact_info.title or profile.target_role):
            if total_user_turns <= 1:
                return "personal"

        if not profile.work_experience or not any(e.highlights for e in profile.work_experience):
            if total_user_turns <= 3:
                return "experience"

        all_skills_count = (
            len(profile.skills.technical_skills) +
            len(profile.skills.frameworks_libraries) +
            len(profile.skills.developer_tools)
        )
        if all_skills_count < 3 and total_user_turns <= 5:
            return "skills"

        if not profile.education and total_user_turns <= 7:
            return "education"

        if not profile.projects and total_user_turns <= 9:
            return "projects"

        if total_user_turns >= 10:
            return "completed"

        return "experience"

    @classmethod
    def _build_coach_messages(cls, session: InterviewSessionState, user_input: str) -> List[Dict[str, str]]:
        """Constructs multi-turn conversational messages for Adil's AI Voice Interviewer."""
        profile = session.collected_profile
        status_summary = cls._build_candidate_status(profile)

        # Dynamic instruction header
        system_content = (
            f"{ADIL_AI_SYSTEM_PROMPT}\n\n"
            f"--- CURRENT CANDIDATE RESUME PROFILE FACTS ---\n{status_summary}\n\n"
            f"Speak aloud as Adil's AI. Acknowledge candidate's input in 1 short sentence, then ask 1 dynamic follow-up. Do not fabricate anything."
        )

        messages = [{"role": "system", "content": system_content}]

        # Include up to last 6 messages from conversation history for coherent context
        recent_history = session.messages[-6:]
        for msg in recent_history:
            role = "assistant" if msg.sender == "ai" else "user"
            # Strip internal tokens from displayed history
            text = sanitize_text(msg.text.replace("[INTERVIEW_COMPLETE]", "").strip())
            if text:
                messages.append({"role": role, "content": text})

        return messages

    # ---- Fast Streaming Turn ----

    @classmethod
    def stream_turn(cls, session: InterviewSessionState, user_input: str) -> Generator[str, None, None]:
        """
        High-speed generator that:
        1. Captures user input and runs instant NLP field extraction.
        2. Streams conversational response tokens immediately (<400ms TTFT).
        3. Enriches profile with structured LLM JSON extraction.
        4. Yields final state with live ATS resume updates.
        """
        user_input_clean = sanitize_text(user_input.strip())
        session.messages.append(InterviewMessage(sender="user", text=user_input_clean))

        step_parts = session.current_step.split("|")
        ai_mode = step_parts[1] if len(step_parts) > 1 else "fallback"
        step_name = step_parts[0]

        llm = get_llm()
        if not llm.is_available() or ai_mode == "fallback":
            updated = cls._process_fallback_turn(session, user_input_clean, step_name)
            last_ai = updated.messages[-1].text if updated.messages else ""
            yield f"data: {json.dumps({'token': last_ai, 'done': True, 'session': updated.dict()}, ensure_ascii=False)}\n\n"
            return

        # 1. Deterministic instant extraction (0ms) to ensure baseline fields are never missed
        cls._deterministic_extract(session, user_input_clean)

        # Check for explicit completion requests
        lower_input = user_input_clean.lower()
        if any(trigger in lower_input for trigger in ["finish interview", "export resume", "i'm done", "im done", "finish and open", "finalize", "finalise", "khatam karo", "complete karo"]):
            concl_msg = "Great, Adil. I have enough information to build your resume. I'm going to finalise everything now."
            session.messages.append(InterviewMessage(sender="ai", text=concl_msg))
            session.is_complete = True
            session.current_step = "completed|llm"
            session.last_updated_section = "summary"
            yield f"data: {json.dumps({'token': concl_msg, 'done': True, 'session': session.dict()}, ensure_ascii=False)}\n\n"
            return

        # 2. Build multi-turn context messages
        coach_messages = cls._build_coach_messages(session, user_input_clean)

        full_response = ""
        inside_think = False

        try:
            for token in llm.stream_chat(coach_messages, temperature=0.6, max_tokens=400):
                full_response += token

                if "<think>" in token:
                    inside_think = True
                if inside_think:
                    if "</think>" in token:
                        inside_think = False
                        clean_part = token.split("</think>", 1)[-1]
                        clean_part = clean_part.replace("[INTERVIEW_COMPLETE]", "").strip()
                        clean_part = sanitize_text(clean_part)
                        if clean_part:
                            yield f"data: {json.dumps({'token': clean_part, 'done': False}, ensure_ascii=False)}\n\n"
                    continue

                if "[INTERVIEW_COMPLETE]" not in token:
                    clean_tok = sanitize_text(token)
                    if clean_tok:
                        yield f"data: {json.dumps({'token': clean_tok, 'done': False}, ensure_ascii=False)}\n\n"

        except Exception as e:
            logger.error(f"Groq streaming error: {e}")
            ack = cls._generate_acknowledgment(step_name, user_input_clean)
            fallback_reply = f"{ack} Could you share more details on the specific technologies and responsibilities you handled?"
            full_response = fallback_reply
            yield f"data: {json.dumps({'token': fallback_reply, 'done': False}, ensure_ascii=False)}\n\n"

        clean_response = cls._strip_think_tags(full_response).strip()
        is_complete = "[INTERVIEW_COMPLETE]" in clean_response
        clean_response = clean_response.replace("[INTERVIEW_COMPLETE]", "").strip()

        if is_complete:
            clean_response = "Great, Adil. I have enough information to build your resume. I'm going to finalise everything now."

        if not clean_response:
            clean_response = "Great. Tell me more about what you built or learned in that role."

        session.messages.append(InterviewMessage(sender="ai", text=clean_response))

        if is_complete:
            session.is_complete = True
            session.current_step = "completed|llm"
        else:
            active_focus = cls._determine_focus_section(session)
            session.current_step = f"{active_focus}|llm"

        # 3. High-intelligence background extraction: enrich ATS bullets, summary & skills
        try:
            cls._ai_extract_and_enrich(session, user_input_clean)
        except Exception as e:
            logger.warning(f"Background AI extraction warning: {e}")

        # Final SSE event with updated session and complete profile
        yield f"data: {json.dumps({'token': '', 'done': True, 'session': session.dict()}, ensure_ascii=False)}\n\n"

    # ---- Non-Streaming Blocking Turn ----

    @classmethod
    def process_turn(cls, session: InterviewSessionState, user_input: str) -> InterviewSessionState:
        """Blocking chat process turn."""
        user_input_clean = sanitize_text(user_input.strip())
        session.messages.append(InterviewMessage(sender="user", text=user_input_clean))

        step_parts = session.current_step.split("|")
        ai_mode = step_parts[1] if len(step_parts) > 1 else "fallback"
        step_name = step_parts[0]

        if ai_mode != "llm":
            return cls._process_fallback_turn(session, user_input_clean, step_name)

        llm = get_llm()
        if not llm.is_available():
            session.current_step = f"{step_name}|fallback"
            return cls._process_fallback_turn(session, user_input_clean, step_name)

        # 1. Deterministic extract
        cls._deterministic_extract(session, user_input_clean)

        # Check for explicit completion requests
        lower_input = user_input_clean.lower()
        if any(trigger in lower_input for trigger in ["finish interview", "export resume", "i'm done", "im done", "finish and open", "finalize", "finalise", "khatam karo", "complete karo"]):
            concl_msg = "Great, Adil. I have enough information to build your resume. I'm going to finalise everything now."
            session.messages.append(InterviewMessage(sender="ai", text=concl_msg))
            session.is_complete = True
            session.current_step = "completed|llm"
            session.last_updated_section = "summary"
            return session

        # 2. Get LLM response
        coach_messages = cls._build_coach_messages(session, user_input_clean)
        try:
            raw_response = llm.chat(coach_messages, temperature=0.6, max_tokens=400)
            clean_response = cls._strip_think_tags(raw_response).strip()
        except Exception as e:
            logger.warning(f"LLM chat error: {e}")
            ack = cls._generate_acknowledgment(step_name, user_input_clean)
            clean_response = f"{ack} Could you elaborate on your accomplishments and the impact you achieved?"

        is_complete = "[INTERVIEW_COMPLETE]" in clean_response
        clean_response = clean_response.replace("[INTERVIEW_COMPLETE]", "").strip()

        if is_complete:
            clean_response = "Great, Adil. I have enough information to build your resume. I'm going to finalise everything now."

        if not clean_response:
            clean_response = "Great! Tell me more about what you built or learned in that role."

        session.messages.append(InterviewMessage(sender="ai", text=clean_response))

        if is_complete:
            session.is_complete = True
            session.current_step = "completed|llm"
        else:
            active_focus = cls._determine_focus_section(session)
            session.current_step = f"{active_focus}|llm"

        # 3. AI extraction & enrichment
        try:
            cls._ai_extract_and_enrich(session, user_input_clean)
        except Exception as e:
            logger.warning(f"Background AI extraction warning: {e}")

        return session

    # ---- Deterministic Rule-Based Extraction (0ms guarantee) ----

    @classmethod
    def _deterministic_extract(cls, session: InterviewSessionState, text: str):
        """Instant rule-based parser ensuring core fields are immediately populated."""
        profile = session.collected_profile

        # 1. Candidate Full Name (English + Roman Urdu)
        if not profile.contact_info.full_name:
            name_m = re.search(r'(?:my name is|i am|i\'m|name:|mera naam|main|mein)\s+([A-Z][A-Za-z\s\.\-]+?)(?:\s+hoon|\s+hai|\s*,|\s+and|\s+aiming|\s+targeting|\s+looking|\.|$)', text, re.IGNORECASE)
            if name_m:
                cand_name = name_m.group(1).strip()
                if 2 <= len(cand_name.split()) <= 4:
                    profile.contact_info.full_name = cand_name
                    profile.title = f"{cand_name}'s Resume"
                    session.last_updated_section = "personal"
            else:
                parts = [p.strip() for p in text.split(',') if p.strip()]
                if parts and 2 <= len(parts[0].split()) <= 4 and not any(k in parts[0].lower() for k in ["degree", "work", "experience", "skill", "university"]):
                    profile.contact_info.full_name = parts[0]
                    profile.title = f"{parts[0]}'s Resume"
                    session.last_updated_section = "personal"

        # 2. Email Address
        if not profile.contact_info.email:
            email_m = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
            if email_m:
                profile.contact_info.email = email_m.group(0)
                session.last_updated_section = "personal"

        # 3. Phone Number
        if not profile.contact_info.phone:
            phone_m = re.search(r'(\+?\d[\d\s\-().]{7,}\d)', text)
            if phone_m and len(re.sub(r'\D', '', phone_m.group(0))) >= 7:
                profile.contact_info.phone = phone_m.group(0).strip()
                session.last_updated_section = "personal"

        # 4. Target Role / Title
        if not profile.contact_info.title:
            role_m = re.search(
                r'(?:aiming for\s+(?:a\s+)?|targeting\s+(?:a\s+)?|seeking\s+(?:a\s+)?|role:\s*|as\s+(?:a\s+)?|banna chahta hoon\s+(?:as\s+)?)([A-Za-z0-9\s\/\-]+?(?:developer|engineer|designer|manager|architect|lead|specialist|intern|consultant|scientist|analyst))\b',
                text, re.IGNORECASE
            )
            if role_m:
                clean_title = role_m.group(1).strip()
                profile.contact_info.title = clean_title
                profile.target_role = clean_title
                session.last_updated_section = "personal"

        # 5. Skills Detection (mapped from comprehensive ontology)
        skills_found = cls._find_skills(text)
        new_skill_added = False
        for s in skills_found:
            meta = ALL_SKILLS_MAP.get(s.lower(), {})
            cat = meta.get("category", "")
            if cat == "Programming Languages":
                if s not in profile.skills.technical_skills:
                    profile.skills.technical_skills.append(s)
                    new_skill_added = True
            elif cat == "Frameworks & Libraries":
                if s not in profile.skills.frameworks_libraries:
                    profile.skills.frameworks_libraries.append(s)
                    new_skill_added = True
            elif cat in ["Developer Tools & Methods", "Databases & Caching", "Cloud & DevOps"]:
                if s not in profile.skills.developer_tools:
                    profile.skills.developer_tools.append(s)
                    new_skill_added = True
            elif cat == "Soft Skills & Leadership":
                if s not in profile.skills.soft_skills:
                    profile.skills.soft_skills.append(s)
                    new_skill_added = True
        if new_skill_added:
            session.last_updated_section = "skills"

        # 6. Education Cues (English + Roman Urdu + Hindi)
        deg_cues = ["b.s", "b.a", "bachelor", "master", "m.s", "ph.d", "degree", "computer science", "software engineering", "cs", "se", "bba", "it", "engineering"]
        school_cues = ["university", "college", "institute", "school", "iba", "nust", "fast", "lums", "iit", "giki", "comsats", "ned", "sukkur"]
        urdu_edu_cues = ["kar raha hoon", "kar rahi hoon", "parh raha hoon", "parha hai", "kiya hai", "graduated from", "graduate kiya"]
        if any(dk in text.lower() for dk in deg_cues) or any(sk in text.lower() for sk in school_cues) or any(uk in text.lower() for uk in urdu_edu_cues):
            edu = EducationItem()
            deg_m = re.search(r'\b(?:b\.?s\.?|b\.?a\.?|m\.?s\.?|ph\.?d\.?|bachelor(?:[\'s]|\s+of\s+[A-Za-z]+)?|master(?:[\'s]|\s+of\s+[A-Za-z]+)?)\b(?:\s+in\s+([A-Za-z\s]+))?', text, re.IGNORECASE)
            if deg_m:
                edu.degree = deg_m.group(0).strip()
            elif "computer science" in text.lower():
                edu.degree = "BS Computer Science"
            elif "software engineering" in text.lower():
                edu.degree = "BS Software Engineering"
            elif " at " in text:
                edu.degree = text.split(" at ", 1)[0].strip()

            # Check known institutions first (e.g. Sukkur IBA, FAST, NUST, LUMS)
            for sk, disp in [
                ("sukkur iba", "Sukkur IBA University"),
                ("sukkur", "Sukkur IBA University"),
                ("nust", "NUST"),
                ("fast", "FAST-NUCES"),
                ("lums", "LUMS"),
                ("giki", "GIKI"),
                ("comsats", "COMSATS"),
                ("ned", "NED University"),
                ("iit", "IIT"),
            ]:
                if sk in text.lower():
                    edu.institution = disp
                    break

            if not edu.institution:
                inst_m = re.search(r'(?:at|from)\s+([A-Za-z\s]+?)(?:\s+in\s+\d{4}|\s+with|\.|\,|$)', text, re.IGNORECASE)
                if inst_m:
                    inst_cand = inst_m.group(1).strip()
                    if len(inst_cand.split()) <= 5:
                        edu.institution = inst_cand

            if not edu.institution and any(sk in text.lower() for sk in ["university", "college", "institute"]):
                for part in re.split(r'[,;]\s*|\bin\b|\bfrom\b|\bse\b', text):
                    if any(sk in part.lower() for sk in ["university", "college", "institute"]):
                        edu.institution = re.sub(r'\b(?:at|from|se)\s+', '', part, flags=re.IGNORECASE).strip()
                        break

            years = re.findall(r'\b(20\d{2}|19\d{2})\b', text)
            if len(years) >= 2:
                edu.start_date, edu.end_date = years[0], years[1]
            elif len(years) == 1:
                edu.end_date = years[0]

            gpa_m = re.search(r'\b(?:gpa[:\s]*|with(?:\s+a)?\s+)([0-4]\.\d{1,2}(?:\s*\/\s*[0-4]\.\d{1,2})?)\b', text, re.IGNORECASE)
            if gpa_m:
                edu.gpa = gpa_m.group(1).strip()

            if edu.degree or edu.institution:
                if not profile.education:
                    profile.education.append(edu)
                else:
                    if edu.degree and not profile.education[-1].degree:
                        profile.education[-1].degree = edu.degree
                    if edu.institution and not profile.education[-1].institution:
                        profile.education[-1].institution = edu.institution
                    if edu.end_date:
                        profile.education[-1].end_date = edu.end_date
                    if edu.gpa:
                        profile.education[-1].gpa = edu.gpa
                session.last_updated_section = "education"

        # 7. Basic Work Experience & Internship Extraction (English + Urdu)
        exp_triggers = ["worked at", "working at", "lead for", "engineer at", "role at", "experience at", "internship", "intern at", "intern", "kaam kiya", "job ki"]
        if any(k in text.lower() for k in exp_triggers):
            comp_m = re.search(r'(?:at|for|with|mein)\s+([A-Z][A-Za-z0-9\s\.\-]+?)(?:\s+as|\s+for|\s+where|\s+mein|\.|\,|$)', text)
            pos_m = re.search(r'(?:as\s+(?:a\s+)?|role\s+(?:as\s+)?)([A-Za-z0-9\s\-]+?(?:developer|engineer|designer|manager|architect|lead|specialist|intern|consultant|scientist|analyst))\b', text, re.IGNORECASE)
            comp = comp_m.group(1).strip() if comp_m else ("Software Company" if "internship" in text.lower() else "Company")
            pos = pos_m.group(1).strip() if pos_m else ("Software Engineering Intern" if "intern" in text.lower() else (profile.contact_info.title or "Software Engineer"))
            existing = next((e for e in profile.work_experience if e.company.lower() == comp.lower()), None)
            if not existing:
                new_exp = ExperienceItem(company=comp, position=pos, highlights=[text])
                profile.work_experience.append(new_exp)
            else:
                if text not in existing.highlights:
                    existing.highlights.append(text)
            session.last_updated_section = "experience"

        # 8. Projects Extraction (English + Urdu: "Maine ek AI project banaya tha")
        proj_triggers = ["project banaya", "project kiya", "project banaya tha", "built a project", "created a project", "developed a project", "working on a project"]
        if any(k in text.lower() for k in proj_triggers) or (("project" in text.lower() or "built" in text.lower()) and skills_found):
            title = "Software Project"
            if "ai" in text.lower():
                title = "AI Project"
            elif "telemetry" in text.lower():
                title = "Telemetry System"
            elif "web" in text.lower() or "app" in text.lower():
                title = "Web Application"

            title_m = re.search(r'(?:project\s+(?:called|named|on)\s+|built\s+(?:a\s+)?)([A-Za-z0-9\s\-]+?)(?:\s+using|\s+with|\s+in|\.|\,|$)', text, re.IGNORECASE)
            if title_m:
                cand = title_m.group(1).strip()
                if cand and not any(v in cand.lower() for v in ["banaya", "kiya", "tha", "using", "with"]):
                    if 1 <= len(cand.split()) <= 4:
                        title = cand.title()

            existing_proj = next((p for p in profile.projects if p.title.lower() == title.lower()), None)
            if not existing_proj:
                profile.projects.append(ProjectItem(
                    title=title,
                    technologies=skills_found,
                    description=text
                ))
            else:
                existing_proj.technologies = list(set(existing_proj.technologies + skills_found))
            session.last_updated_section = "projects"

    # ---- Intelligent LLM JSON Extraction & Enrichment ----

    @classmethod
    def _ai_extract_and_enrich(cls, session: InterviewSessionState, user_text: str):
        """Uses fast structured JSON LLM to polish facts into ATS-ready bullets, summary, and clean records."""
        llm = get_llm()
        if not llm.is_available():
            return

        # Skip JSON extraction on trivial 1-2 word replies
        if len(user_text.split()) < 4:
            return

        profile = session.collected_profile

        prompt_messages = [
            {
                "role": "system",
                "content": (
                    "You are an ATS Resume Extraction & Formatting Engine. "
                    "The candidate's input may be in English, Urdu (اردو), Hindi (हिन्दी), or mixed Roman Urdu / Hinglish "
                    "(e.g., 'Main Sukkur IBA mein Computer Science kar raha hoon', 'Maine ek AI project banaya tha using Python'). "
                    "Translate and extract real candidate facts into clean, professional, ATS-optimized English resume JSON.\n"
                    "FORMAT:\n"
                    "{\n"
                    '  "full_name": string or null,\n'
                    '  "target_role": string or null,\n'
                    '  "location": string or null,\n'
                    '  "summary_snippet": string (compelling 1-2 sentence executive pitch synthesizing experience) or null,\n'
                    '  "technical_skills": [string],\n'
                    '  "frameworks_libraries": [string],\n'
                    '  "tools_cloud": [string],\n'
                    '  "experience": [\n'
                    '    {"company": string, "position": string, "duration": string or null, "achievements": [string (concise ATS action-verb bullets with metrics)]}\n'
                    '  ],\n'
                    '  "projects": [\n'
                    '    {"title": string, "technologies": [string], "description": string}\n'
                    '  ],\n'
                    '  "education": [\n'
                    '    {"degree": string, "institution": string, "graduation_year": string or null, "gpa": string or null}\n'
                    '  ]\n'
                    "}\n"
                    "CRITICAL ZERO FABRICATION RULES:\n"
                    "- Strictly NEVER invent, assume, or fabricate any degrees, universities, companies, roles, metrics, percentages, tools, or achievements. Only extract what was explicitly stated.\n"
                    "- Only output non-empty fields. Format bullet points with strong past-tense action verbs (e.g., 'Architected', 'Engineered', 'Developed')."
                )
            },
            {
                "role": "user",
                "content": user_text
            }
        ]

        data = llm.extract_json(prompt_messages, max_tokens=500)
        if not isinstance(data, dict):
            return

        # 1. Identity & Role
        if data.get("full_name") and not profile.contact_info.full_name:
            profile.contact_info.full_name = data["full_name"]
            profile.title = f"{data['full_name']}'s Resume"

        if data.get("target_role") and not profile.contact_info.title:
            profile.contact_info.title = data["target_role"]
            profile.target_role = data["target_role"]

        if data.get("location") and not profile.contact_info.location:
            profile.contact_info.location = data["location"]

        # 2. Polished Summary
        if data.get("summary_snippet"):
            profile.summary = data["summary_snippet"]

        # 3. Categorized Skills
        for s in data.get("technical_skills", []):
            if s and s not in profile.skills.technical_skills:
                profile.skills.technical_skills.append(s)
        for s in data.get("frameworks_libraries", []):
            if s and s not in profile.skills.frameworks_libraries:
                profile.skills.frameworks_libraries.append(s)
        for s in data.get("tools_cloud", []):
            if s and s not in profile.skills.developer_tools:
                profile.skills.developer_tools.append(s)

        # 4. Work Experience & Polished Bullets
        for exp_dict in data.get("experience", []):
            comp = exp_dict.get("company")
            pos = exp_dict.get("position")
            achievements = exp_dict.get("achievements", [])
            dur = exp_dict.get("duration")

            if comp or pos:
                # Find matching experience item or create new
                match = None
                if comp:
                    match = next((e for e in profile.work_experience if e.company and comp.lower() in e.company.lower()), None)
                if not match and profile.work_experience:
                    # If position matches
                    match = next((e for e in profile.work_experience if e.position and pos and pos.lower() in e.position.lower()), None)

                if match:
                    if pos and (not match.position or match.position == "Software Engineer"):
                        match.position = pos
                    if dur and not match.start_date:
                        match.start_date = dur
                    for bullet in achievements:
                        if bullet and bullet not in match.highlights:
                            # Replace raw placeholder if present
                            if match.highlights and len(match.highlights) == 1 and len(match.highlights[0]) > 100:
                                match.highlights = [bullet]
                            else:
                                match.highlights.append(bullet)
                else:
                    new_item = ExperienceItem(
                        company=comp or "Company",
                        position=pos or (profile.contact_info.title or "Specialist"),
                        start_date=dur or "",
                        highlights=achievements if achievements else [user_text]
                    )
                    profile.work_experience.append(new_item)

        # 5. Projects
        for proj_dict in data.get("projects", []):
            title = proj_dict.get("title")
            techs = proj_dict.get("technologies", [])
            desc = proj_dict.get("description", "")
            if title:
                match = next((p for p in profile.projects if p.title.lower() == title.lower()), None)
                if not match:
                    profile.projects.append(ProjectItem(
                        title=title,
                        technologies=techs,
                        description=desc
                    ))

        # 6. Education
        for edu_dict in data.get("education", []):
            deg = edu_dict.get("degree")
            inst = edu_dict.get("institution")
            yr = edu_dict.get("graduation_year")
            gpa = edu_dict.get("gpa")
            if deg or inst:
                if profile.education:
                    if deg and not profile.education[0].degree:
                        profile.education[0].degree = deg
                    if inst and not profile.education[0].institution:
                        profile.education[0].institution = inst
                    if yr and not profile.education[0].end_date:
                        profile.education[0].end_date = yr
                    if gpa and not profile.education[0].gpa:
                        profile.education[0].gpa = gpa
                else:
                    profile.education.append(EducationItem(
                        degree=deg or "",
                        institution=inst or "",
                        end_date=yr or "",
                        gpa=gpa or ""
                    ))

        # 7. Identify and record the primary section updated in this turn
        if data.get("education"):
            session.last_updated_section = "education"
        elif data.get("experience"):
            session.last_updated_section = "experience"
        elif data.get("projects"):
            session.last_updated_section = "projects"
        elif data.get("technical_skills") or data.get("frameworks_libraries") or data.get("tools_cloud"):
            session.last_updated_section = "skills"
        elif data.get("summary_snippet"):
            session.last_updated_section = "summary"
        elif data.get("full_name") or data.get("target_role") or data.get("location"):
            session.last_updated_section = "personal"

    # ---- Fallback Deterministic Flow (Offline Mode) ----

    @classmethod
    def _process_fallback_turn(cls, session: InterviewSessionState, user_input: str, step_name: str) -> InterviewSessionState:
        idx = session.question_index
        profile = session.collected_profile
        cls._deterministic_extract(session, user_input)

        next_idx = idx + 1
        session.question_index = next_idx

        if next_idx < len(FALLBACK_FLOW_STEPS):
            next_step_meta = FALLBACK_FLOW_STEPS[next_idx]
            session.current_step = f"{next_step_meta['step']}|fallback"
            ack = cls._generate_acknowledgment(step_name, user_input)
            session.messages.append(InterviewMessage(sender="ai", text=f"{ack} {next_step_meta['intro']}"))
        else:
            session.is_complete = True
            session.current_step = "completed|fallback"
            session.messages.append(InterviewMessage(
                sender="ai",
                text="Great, Adil. I have enough information to build your resume. I'm going to finalise everything now."
            ))

        return session

    # ---- Helpers ----

    @staticmethod
    def _strip_think_tags(text: str) -> str:
        """Remove <think>...</think> reasoning blocks from model output."""
        return re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()

    @classmethod
    def _find_skills(cls, text: str) -> List[str]:
        found = []
        text_lower = text.lower()
        for skill_kw, meta in ALL_SKILLS_MAP.items():
            pattern = r'(?:\b|(?<=\s))' + re.escape(skill_kw) + r'(?:\b|(?=\s|,|\.|\/))'
            if re.search(pattern, text_lower):
                found.append(meta["display"])
        return found

    @staticmethod
    def _generate_acknowledgment(step_name: str, user_text: str) -> str:
        step_name = step_name.split("|")[0]
        acks = {
            "personal": "Great to meet you!",
            "education": "Solid academic credentials!",
            "experience": "That provides strong technical foundation.",
            "projects": "That project demonstrates excellent technical initiative.",
            "skills": "A versatile and in-demand technical stack.",
            "certifications": "Impressive qualifications!",
            "summary": "Clear executive direction!",
        }
        return acks.get(step_name, "Understood!")
