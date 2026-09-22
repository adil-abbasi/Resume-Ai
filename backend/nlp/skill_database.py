"""
Comprehensive skill dictionary and keyword taxonomy for deterministic NLP resume and job parsing.
"""

SKILL_CATEGORIES = {
    "Programming Languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "c", "ruby", "golang", "go",
        "rust", "php", "swift", "kotlin", "scala", "r", "dart", "matlab", "perl", "haskell",
        "elixir", "clojure", "sql", "html", "html5", "css", "css3", "sass", "scss", "bash", "shell", "powershell"
    ],
    "Frameworks & Libraries": [
        "react", "react.js", "next.js", "nextjs", "vue", "vue.js", "nuxt", "angular", "svelte", "sveltekit",
        "node.js", "nodejs", "express", "express.js", "nest.js", "nestjs", "fastapi", "django", "flask",
        "spring", "spring boot", "ruby on rails", "asp.net", ".net core", "laravel", "gin", "fiber",
        "pytorch", "tensorflow", "keras", "scikit-learn", "sklearn", "pandas", "numpy", "opencv",
        "tailwind", "tailwindcss", "bootstrap", "material-ui", "mui", "shadcn", "redux", "zustand",
        "graphql", "trpc", "prisma", "hibernate", "entity framework", "langchain", "llamaindex", "huggingface"
    ],
    "Databases & Caching": [
        "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis", "cassandra", "dynamodb",
        "elasticsearch", "supabase", "firebase", "couchbase", "neo4j", "mariadb", "snowflake", "bigquery", "clickhouse"
    ],
    "Cloud & DevOps": [
        "aws", "amazon web services", "azure", "google cloud", "gcp", "docker", "kubernetes", "k8s",
        "terraform", "ansible", "ci/cd", "github actions", "gitlab ci", "jenkins", "circleci", "argo cd",
        "helm", "prometheus", "grafana", "nginx", "apache", "linux", "cloudformation", "serverless", "lambda"
    ],
    "AI, ML & Data": [
        "machine learning", "deep learning", "nlp", "natural language processing", "computer vision",
        "large language models", "llm", "genai", "generative ai", "data analysis", "data engineering",
        "etl", "data visualization", "tableau", "power bi", "spark", "apache spark", "kafka", "airflow",
        "dbt", "databricks", "reinforcement learning", "embeddings", "vector search", "rag"
    ],
    "Developer Tools & Methods": [
        "git", "github", "gitlab", "jira", "confluence", "postman", "swagger", "openapi", "webpack",
        "vite", "esbuild", "jest", "pytest", "cypress", "playwright", "vitest", "mocha", "selenium",
        "agile", "scrum", "kanban", "microservices", "rest api", "restful apis", "grpc", "websockets",
        "system design", "test-driven development", "tdd", "ci/cd pipelines"
    ],
    "Soft Skills & Leadership": [
        "leadership", "communication", "teamwork", "collaboration", "problem solving", "critical thinking",
        "project management", "time management", "mentoring", "adaptability", "stakeholder management",
        "cross-functional collaboration", "agile leadership", "conflict resolution", "presentation skills",
        "analytical thinking", "strategic planning", "customer empathy"
    ]
}

# Inverted mapping: lowercase skill -> display name + category
ALL_SKILLS_MAP = {}
for category, skills in SKILL_CATEGORIES.items():
    for skill in skills:
        ALL_SKILLS_MAP[skill.lower()] = {
            "display": skill.title() if len(skill) > 3 and not ("." in skill or "/" in skill) else skill,
            "category": category
        }

# High-impact Action Verbs categorized by career outcome
ACTION_VERBS = {
    "Leadership": [
        "spearheaded", "orchestrated", "championed", "directed", "mentored", "founded", "steered",
        "mobilized", "supervised", "pioneered", "guided", "coordinated", "empowered", "governed"
    ],
    "Engineering & Innovation": [
        "architected", "engineered", "developed", "deployed", "implemented", "constructed", "designed",
        "built", "refactored", "automated", "integrated", "programmed", "configured", "debugged"
    ],
    "Optimization & Growth": [
        "accelerated", "optimized", "amplified", "streamlined", "scaled", "boosted", "maximized",
        "minimized", "reduced", "enhanced", "elevated", "overhauled", "upgraded", "consolidated"
    ],
    "Analytics & Research": [
        "analyzed", "benchmarked", "evaluated", "formulated", "identified", "investigated", "modelled",
        "measured", "synthesized", "tested", "validated", "audited", "discovered", "quantified"
    ]
}

FLATTENED_ACTION_VERBS = {verb for group in ACTION_VERBS.values() for verb in group}

# Weak, passive, or overused phrases that lower resume ATS impact
WEAK_PHRASES = [
    "responsible for",
    "duties included",
    "assisted with",
    "helped to",
    "worked on",
    "involved in",
    "handled the",
    "participated in",
    "tried to",
    "was in charge of",
    "talked to",
    "made sure",
    "did things like"
]

SECTION_SYNONYMS = {
    "summary": [
        "professional summary", "summary", "about me", "profile", "objective",
        "career objective", "executive summary", "overview", "professional profile",
        "personal statement", "summary of qualifications", "biography", "bio",
        "career summary", "statement of purpose", "introduction"
    ],
    "experience": [
        "work experience", "experience", "employment history", "professional experience",
        "work history", "career history", "internships", "relevant experience",
        "employment", "professional background", "experience & internships",
        "work & research experience", "industry experience", "practical experience",
        "work experience & internships", "work history & experience", "employment & experience",
        "professional experience & history", "internships & experience", "work experience & projects"
    ],
    "education": [
        "education", "academic background", "academic history", "qualifications",
        "degrees", "educational qualifications", "education & credentials",
        "academic qualifications", "education and training", "academics",
        "education & honors", "formal education", "education & certifications",
        "educational background", "academic credentials", "degrees & education"
    ],
    "skills": [
        "skills", "technical skills", "core competencies", "technologies",
        "tech stack", "skills & tools", "areas of expertise", "technical competencies",
        "technical expertise", "skills & abilities", "skills summary", "core skills",
        "competencies", "programming languages & tools", "key skills", "tools & technologies",
        "proficiencies", "specialties", "hard skills", "technical skills & tools",
        "skills & competencies", "technical proficiency", "technical stack",
        "skills & technologies", "technical & soft skills", "programming languages", "developer skills"
    ],
    "projects": [
        "projects", "personal projects", "academic projects", "key projects",
        "notable projects", "open source projects", "portfolio", "technical projects",
        "selected projects", "project experience", "recent projects", "featured projects",
        "software projects", "engineering projects", "major projects",
        "projects & open source", "projects and open source", "technical & personal projects",
        "key projects & achievements", "notable technical projects", "key technical projects",
        "portfolio & projects", "recent work & projects", "coding projects", "development projects"
    ],
    "certifications": [
        "certifications", "certificates", "licenses", "courses",
        "professional credentials", "certifications & licenses", "licenses & certifications",
        "credentials", "training & certifications", "accreditations",
        "certificates & courses", "certifications & trainings", "licenses & certificates",
        "professional certifications", "online certifications"
    ],
    "achievements": [
        "achievements", "awards", "honors", "accomplishments",
        "recognition", "awards & achievements", "honors & awards",
        "awards and honors", "honors & achievements", "scholarships",
        "competitions", "publications & awards", "patents", "key achievements"
    ],
    "extracurriculars": [
        "extracurriculars", "extracurricular activities", "volunteer work",
        "volunteering", "leadership & activities", "community",
        "volunteer experience", "leadership experience", "community service",
        "activities & leadership", "campus involvement", "affiliations"
    ],
    "languages": [
        "languages", "languages spoken", "language proficiencies", "language skills"
    ]
}

