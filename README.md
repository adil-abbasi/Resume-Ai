# AI Resume & Career Assistant 🚀

A comprehensive, full-stack AI Resume & Career Builder SaaS application. Features dynamic external job searching, truthful ATS scoring, conversational AI voice interviewing ("Adil's AI"), LinkedIn profile import via OAuth 2.0 / OIDC, interactive Resume Studio with multiple export formats (PDF / DOCX), and modern developer portfolio generation.

---

## ✨ Features

- **🎯 Live Dynamic Job Search & AI Matching Engine**:
  - Pluggable provider architecture (`JobSearchService` → `JobSearchProvider`) supporting Adzuna, Jooble, and Live Web Jobs APIs.
  - Candidate profile-based query generation (target roles, top technical skills, seniority level).
  - Truth-preserving skill gap analysis & match scoring directly from real job descriptions.
  - Zero fake/dummy job fallbacks.
- **🎙️ Conversational AI Voice Interviewer ("Adil's AI")**:
  - Real-time interactive voice interview with an audio-reactive animated visual orb.
  - Conversational turn-taking with live transcription and continuous profile synthesis.
- **📄 Deterministic ATS Resume Analyzer**:
  - Full text & structure extraction for PDF and DOCX documents.
  - High-precision section parsing, keyword extraction, and actionable tailoring guidance.
- **🎨 Interactive Resume Studio**:
  - Real-time preview with multiple professional templates.
  - Section-by-section editing, reordering, and customization.
  - Direct export to ATS-compliant PDF and styled Word (`.docx`).
- **🔗 LinkedIn OAuth 2.0 / OpenID Connect Import**:
  - Server-side token exchange and user info extraction.
  - Automatic ATS resume generation from verified profile data.
- **🌐 Web Portfolio Generator**:
  - Generates instant responsive portfolio websites from candidate resume profiles.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Lucide Icons
- **Audio & Animations**: HTML5 Web Audio API, Canvas rendering

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **NLP / Document Parsing**: `pypdf`, `python-docx`, deterministic regex & keyword taxonomy
- **LLM Integration**: Groq API (`openai/gpt-oss-120b`), Ollama local model support (`qwen3:4b`)
- **Job Providers**: Adzuna API, Jooble API, Live Web developer feeds

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Git

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Fill in your API keys in .env
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔒 Security & Privacy

- All API keys, OAuth secrets, and provider credentials remain strictly server-side.
- Zero fake jobs or fabricated candidate metrics.
