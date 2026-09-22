from models.schemas import (
    ResumeProfile, ContactInfo, ExperienceItem, EducationItem,
    ProjectItem, CertificationItem, SkillsGroup
)

SAMPLE_RESUMES = {
    "software_engineer": ResumeProfile(
        id="sample-swe",
        title="Alex Chen - Senior Full Stack Engineer",
        target_role="Senior Full Stack Engineer",
        contact_info=ContactInfo(
            full_name="Alex Chen",
            email="alex.chen@example.com",
            phone="+1 (555) 234-5678",
            location="San Francisco, CA",
            linkedin="linkedin.com/in/alexchen-dev",
            github="github.com/alexchen",
            portfolio="https://alexchen.dev",
            title="Senior Full Stack Engineer"
        ),
        summary="Senior Full Stack Software Engineer with 5+ years of experience architecting high-scale distributed systems, web applications, and cloud microservices. Proven record in reducing latency by 45% and leading cross-functional teams to ship enterprise SaaS products.",
        skills=SkillsGroup(
            technical_skills=["Python", "TypeScript", "JavaScript", "Go", "SQL", "HTML5", "CSS3"],
            frameworks_libraries=["React", "Next.js", "FastAPI", "Node.js", "Express", "TailwindCSS", "Redux"],
            developer_tools=["Docker", "Kubernetes", "AWS", "PostgreSQL", "Redis", "Git", "GitHub Actions", "Terraform", "Jest"],
            soft_skills=["Team Leadership", "System Design", "Agile/Scrum", "Mentoring", "Cross-Functional Collaboration"],
            other=["RESTful APIs", "GraphQL", "Microservices", "CI/CD Pipelines"]
        ),
        work_experience=[
            ExperienceItem(
                company="Apex Cloud Technologies",
                position="Senior Full Stack Engineer",
                location="San Francisco, CA",
                start_date="2022",
                end_date="Present",
                current=True,
                highlights=[
                    "Architected high-throughput API gateway handling 15M+ daily requests using FastAPI and Redis, cutting p99 latency by 42%.",
                    "Spearheaded migration of legacy monolith to Next.js 14 server components, boosting Lighthouse performance score from 61 to 98.",
                    "Mentored 6 junior and mid-level engineers, establishing automated CI/CD quality gates with GitHub Actions that reduced regression bugs by 35%."
                ]
            ),
            ExperienceItem(
                company="Hyperion Analytics",
                position="Software Engineer",
                location="Austin, TX",
                start_date="2020",
                end_date="2022",
                current=False,
                highlights=[
                    "Engineered real-time analytics dashboard with React, TypeScript, and WebSockets, supporting 20K+ concurrent users.",
                    "Optimized complex PostgreSQL queries and indexed database tables, reducing median dashboard query time from 4.2s to 380ms.",
                    "Integrated OAuth2 authentication and role-based access control (RBAC), securing sensitive financial data across 500+ enterprise tenants."
                ]
            )
        ],
        education=[
            EducationItem(
                institution="University of California, Berkeley",
                degree="B.S. in Computer Science",
                field_of_study="Computer Science",
                start_date="2016",
                end_date="2020",
                gpa="3.85 / 4.0",
                location="Berkeley, CA",
                highlights=["Dean's Honor List", "President of Web Development Club", "Coursework: Distributed Systems, Algorithms, Database Systems"]
            )
        ],
        projects=[
            ProjectItem(
                title="CloudMetrics — Distributed Observability Platform",
                description="Open-source microservices monitoring agent with real-time alerting and metrics visualization.",
                technologies=["Go", "React", "Docker", "Prometheus", "TailwindCSS"],
                link="https://github.com/alexchen/cloudmetrics",
                highlights=[
                    "Engineered lightweight Go telemetry daemon with < 1% CPU overhead deployed across 1,000+ container nodes.",
                    "Constructed interactive Grafana-style charting frontend using React and Canvas, rendering 100K data points smoothly at 60 FPS."
                ]
            ),
            ProjectItem(
                title="AI Resume & Career Assistant",
                description="SaaS platform for resume parsing, conversational AI interviewing, and ATS optimization.",
                technologies=["Next.js", "FastAPI", "Python", "TailwindCSS", "PostgreSQL"],
                link="https://github.com/alexchen/career-ai",
                highlights=[
                    "Developed deterministic NLP keyword extraction engine achieving 96% accuracy across PDF/DOCX formats.",
                    "Built full conversational interviewing pipeline with speech-to-text integration and live template preview."
                ]
            )
        ],
        certifications=[
            CertificationItem(name="AWS Certified Solutions Architect – Associate", issuer="Amazon Web Services", issue_date="2023"),
            CertificationItem(name="Certified Kubernetes Administrator (CKA)", issuer="Cloud Native Computing Foundation", issue_date="2022")
        ],
        achievements=[
            "Winner of Silicon Valley Hackathon 2023 (1st place out of 120 teams)",
            "Published technical article on High-Performance Microservices with 40K+ reads"
        ],
        extracurriculars=[
            "Open Source Contributor to React ecosystem and FastAPI libraries",
            "Volunteer STEM mentor for underrepresented high school students"
        ]
    ),
    "fresh_grad": ResumeProfile(
        id="sample-grad",
        title="Maya Patel - Junior Software Developer",
        target_role="Junior Software Engineer",
        contact_info=ContactInfo(
            full_name="Maya Patel",
            email="maya.patel@example.com",
            phone="+1 (555) 890-1234",
            location="Seattle, WA",
            linkedin="linkedin.com/in/mayapatel",
            github="github.com/mayapatel",
            title="Junior Software Engineer"
        ),
        summary="Ambitious Computer Science graduate with strong foundation in object-oriented programming, modern web technologies, and data structures. Experienced in building full-stack applications with React, Python, and SQL through academic projects and internship experience.",
        skills=SkillsGroup(
            technical_skills=["Python", "Java", "JavaScript", "C++", "SQL", "HTML/CSS"],
            frameworks_libraries=["React", "Node.js", "Express", "Flask", "TailwindCSS"],
            developer_tools=["Git", "GitHub", "PostgreSQL", "Docker", "Postman", "VS Code"],
            soft_skills=["Problem Solving", "Team Collaboration", "Quick Learner", "Communication"]
        ),
        work_experience=[
            ExperienceItem(
                company="Innovate Solutions",
                position="Software Engineering Intern",
                location="Seattle, WA",
                start_date="Jun 2023",
                end_date="Sep 2023",
                highlights=[
                    "Developed and unit-tested 12 REST API endpoints using Python Flask and PostgreSQL, achieving 90% code coverage.",
                    "Collaborated with senior engineers in Agile sprints, reviewing pull requests and resolving 25+ software defects."
                ]
            )
        ],
        education=[
            EducationItem(
                institution="University of Washington",
                degree="B.S. in Computer Science",
                field_of_study="Computer Science",
                start_date="2020",
                end_date="2024",
                gpa="3.78 / 4.0",
                highlights=["Undergraduate Teaching Assistant for Intro to Java", "Hackathon Finalist"]
            )
        ],
        projects=[
            ProjectItem(
                title="Campus Marketplace App",
                description="Peer-to-peer student marketplace for textbooks and supplies.",
                technologies=["React", "Node.js", "MongoDB", "Express"],
                highlights=[
                    "Implemented user authentication with JWT and real-time chat with Socket.io, adopted by 800+ university students."
                ]
            )
        ],
        certifications=[
            CertificationItem(name="Meta Front-End Developer Professional Certificate", issuer="Coursera / Meta")
        ],
        achievements=["Dean's List (6 consecutive semesters)"]
    )
}

SAMPLE_JOB_DESCRIPTIONS = [
    {
        "id": "stripe_fullstack",
        "title": "Senior Full Stack Engineer",
        "company": "Stripe",
        "location": "San Francisco, CA (Hybrid / Remote)",
        "salary": "$175,000 - $225,000 + Equity",
        "description": """About Stripe:
Stripe is a financial infrastructure platform for the internet. Millions of companies—from the world's largest enterprises to the most ambitious startups—use Stripe to accept payments, grow their revenue, and accelerate new business opportunities.

The Role:
We are looking for a Senior Full Stack Engineer to join our Payments Experience team. In this role, you will design, build, and deploy customer-facing financial dashboards and resilient backend services that power global transactions.

Responsibilities:
• Architect, build, and maintain scalable, reliable web applications using React, TypeScript, Next.js, and Python / Go services.
• Design secure and performant REST APIs and GraphQL endpoints handling thousands of queries per second.
• Collaborate with product managers, designers, and engineers across global offices to deliver delightful payment experiences.
• Improve developer tooling, CI/CD pipelines, and maintain high standards for unit testing and code quality with Jest and Playwright.
• Optimize database schemas and queries in PostgreSQL and Redis for low-latency transaction processing.

Requirements:
• 4+ years of professional full-stack software development experience.
• Strong proficiency in TypeScript, JavaScript, React, and Python or Go.
• Deep understanding of relational databases (PostgreSQL/MySQL), caching strategies (Redis), and distributed system architecture.
• Experience with cloud platforms (AWS/GCP), containerization (Docker/Kubernetes), and CI/CD pipelines (GitHub Actions).
• Bachelor's degree in Computer Science, Engineering, or equivalent practical experience.
• Outstanding written and verbal communication skills with a track record of mentoring junior engineers.

Preferred Qualifications:
• Experience with fintech, payment processors, or high-security financial applications.
• Familiarity with TailwindCSS, server-side rendering (SSR), and micro-frontends."""
    },
    {
        "id": "netflix_data_ai",
        "title": "Machine Learning & AI Engineer",
        "company": "Netflix",
        "location": "Los Gatos, CA / Remote",
        "salary": "$200,000 - $260,000",
        "description": """About the Role:
At Netflix, we want to entertain the world. The ML Platform team is seeking an experienced Machine Learning Engineer to scale our recommendation systems and generative AI infrastructure.

Key Responsibilities:
• Design, train, and deploy deep learning models and LLM-powered applications for personalization and automated content tagging.
• Build scalable data pipelines using PyTorch, TensorFlow, Python, Spark, and Kafka.
• Implement vector embeddings and RAG pipelines for semantic content search.
• Optimize ML inference latency for real-time serving across millions of global devices using Docker and Kubernetes.

Requirements:
• 3+ years experience building and deploying machine learning pipelines in production.
• Advanced proficiency in Python, PyTorch, Scikit-learn, and Pandas.
• Strong foundation in NLP, LLMs, Transformer architectures, and vector databases.
• Experience with AWS, Docker, Kubernetes, and SQL/PostgreSQL databases.
• Master's or Bachelor's in Computer Science, AI, or related quantitative field."""
    },
    {
        "id": "google_product_manager",
        "title": "Product Manager — Developer Tools",
        "company": "Google",
        "location": "Mountain View, CA",
        "salary": "$160,000 - $210,000",
        "description": """Product Manager, Cloud Developer Ecosystem:
Drive product strategy and execution for developer-facing tools, APIs, and cloud consoles.

Responsibilities:
• Define product roadmap and feature specifications based on user research and telemetry data.
• Partner with engineering, UX design, and developer relations to deliver high-impact features.
• Manage stakeholder communication, sprint planning, and go-to-market launches.

Requirements:
• 3+ years experience in technical product management or software development.
• Strong understanding of developer APIs, cloud architecture, and modern web frameworks.
• Excellent communication, leadership, and analytical skills."""
    }
]
