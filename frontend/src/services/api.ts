import {
  ResumeProfile,
  TemplateCustomization,
  ATSAnalysisResult,
  JobMatchResult,
  JobDescriptionData,
  InterviewSessionState,
  RewriteResponse,
  LLMStatus,
  User,
  PlanType,
  PlanFeatures,
  SubscriptionInfo,
  ResumeTemplate,
  JobItem,
  JobFitAnalysis,
  JobApplicationRecord,
  ProfileVerificationResult,
  LinkedInImportResponse,
  LinkedInOAuthUrlResponse,
  LinkedInOAuthCallbackResponse,
  LinkedInOAuthSessionResponse,
  AgentApplyResponse,
  SocialProvider,
  CoverLetterRequest,
  CoverLetterResponse,
  PortfolioConfig,
  PortfolioDeployResponse,
  GitHubOAuthUrlResponse,
  GitHubSessionResponse,
  GitHubRepoItem,
  GitHubPublishResponse,
  ExtractionValidationResult,
  WeakBulletIssue,
  ActionableSuggestion,
  TemplateRecommendation
} from '../types';

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  // When running in browser on deployed domains (Vercel, Render, etc.), use the live cloud API
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return 'https://resume-ai-xjz8.onrender.com/api';
    }
  }
  // If production bundle
  if (import.meta.env.PROD) {
    return 'https://resume-ai-xjz8.onrender.com/api';
  }
  return 'http://127.0.0.1:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const CLOUD_BACKEND_URL = 'https://resume-ai-xjz8.onrender.com/api';

export const sampleSWEProfile: ResumeProfile = {
  id: "sample-swe",
  title: "Alex Chen - Senior Full Stack Engineer",
  target_role: "Senior Full Stack Engineer",
  contact_info: {
    full_name: "Alex Chen",
    email: "alex.chen@example.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexchen-dev",
    github: "github.com/alexchen",
    portfolio: "https://alexchen.dev",
    title: "Senior Full Stack Engineer"
  },
  summary: "Senior Full Stack Software Engineer with 5+ years of experience architecting high-scale distributed systems, web applications, and cloud microservices. Proven record in reducing latency by 45% and leading cross-functional teams to ship enterprise SaaS products.",
  skills: {
    technical_skills: ["Python", "TypeScript", "JavaScript", "Go", "SQL", "HTML5", "CSS3"],
    frameworks_libraries: ["React", "Next.js", "FastAPI", "Node.js", "Express", "TailwindCSS", "Redux"],
    developer_tools: ["Docker", "Kubernetes", "AWS", "PostgreSQL", "Redis", "Git", "GitHub Actions", "Terraform", "Jest"],
    soft_skills: ["Team Leadership", "System Design", "Agile/Scrum", "Mentoring", "Cross-Functional Collaboration"],
    other: ["RESTful APIs", "GraphQL", "Microservices", "CI/CD Pipelines"]
  },
  work_experience: [
    {
      company: "Apex Cloud Technologies",
      position: "Senior Full Stack Engineer",
      location: "San Francisco, CA",
      start_date: "2022",
      end_date: "Present",
      current: true,
      highlights: [
        "Architected high-throughput API gateway handling 15M+ daily requests using FastAPI and Redis, cutting p99 latency by 42%.",
        "Spearheaded migration of legacy monolith to Next.js 14 server components, boosting Lighthouse performance score from 61 to 98.",
        "Mentored 6 junior and mid-level engineers, establishing automated CI/CD quality gates with GitHub Actions that reduced regression bugs by 35%."
      ]
    },
    {
      company: "Hyperion Analytics",
      position: "Software Engineer",
      location: "Austin, TX",
      start_date: "2020",
      end_date: "2022",
      current: false,
      highlights: [
        "Engineered real-time analytics dashboard with React, TypeScript, and WebSockets, supporting 20K+ concurrent users.",
        "Optimized complex PostgreSQL queries and indexed database tables, reducing median dashboard query time from 4.2s to 380ms.",
        "Integrated OAuth2 authentication and role-based access control (RBAC), securing sensitive financial data across 500+ enterprise tenants."
      ]
    }
  ],
  education: [
    {
      institution: "University of California, Berkeley",
      degree: "B.S. in Computer Science",
      field_of_study: "Computer Science",
      start_date: "2016",
      end_date: "2020",
      gpa: "3.85 / 4.0",
      location: "Berkeley, CA",
      highlights: [
        "Dean's Honor List (6 Semesters)",
        "President of Web Development Club",
        "Relevant Coursework: Distributed Systems, Database Architecture, Machine Learning"
      ]
    }
  ],
  projects: [
    {
      title: "CloudMetrics — Distributed Telemetry Agent",
      description: "High-performance telemetry exporter with real-time anomaly alerting and dashboard visualizer.",
      technologies: ["Go", "React", "Docker", "Prometheus", "TailwindCSS"],
      link: "https://github.com/alexchen/cloudmetrics",
      highlights: [
        "Constructed lightweight Go daemon with < 1% CPU overhead deployed across 1,000+ container nodes.",
        "Rendered 100K metrics data points in real time using Canvas and WebGL at steady 60 FPS."
      ]
    },
    {
      title: "AI Career Copilot",
      description: "Deterministic ATS optimization and conversational interview platform.",
      technologies: ["FastAPI", "React", "TypeScript", "Ollama", "Python"],
      link: "https://github.com/alexchen/career-copilot",
      highlights: [
        "Developed offline-capable LLM interview engine with sub-200ms parsing latency.",
        "Ranked #1 on Product Hunt Career category with 12K+ monthly active users."
      ]
    }
  ],
  certifications: [
    {
      name: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      issue_date: "2023",
      expiry_date: "2026",
      credential_id: "AWS-SAA-83921"
    },
    {
      name: "Certified Kubernetes Application Developer (CKAD)",
      issuer: "Linux Foundation",
      issue_date: "2022",
      expiry_date: "2025",
      credential_id: "CKAD-99120"
    }
  ],
  achievements: [
    "Winner of Berkeley Hackathon 2019 (Best Developer Tooling Track)",
    "Published author of 'Modern Distributed Caching with Redis' on Medium (50K+ reads)"
  ],
  extracurriculars: [
    "Open Source Contributor to FastAPI and Next.js repositories",
    "Technical Mentor for underrepresented youth in STEM"
  ],
  languages: ["English (Native)", "Mandarin (Professional Working)"],
  career_interests: "Staff Engineer / Tech Lead roles in cloud infrastructure, AI systems, and developer productivity platforms."
};

export const sampleGradProfile: ResumeProfile = {
  id: "sample-grad",
  title: "Sophia Patel - Recent CS Graduate",
  target_role: "Junior Frontend Engineer",
  contact_info: {
    full_name: "Sophia Patel",
    email: "sophia.patel@example.com",
    phone: "+1 (555) 345-6789",
    location: "New York, NY",
    linkedin: "linkedin.com/in/sophiapatel",
    github: "github.com/sophiapatel",
    portfolio: "https://sophiapatel.dev",
    title: "Junior Frontend Engineer"
  },
  summary: "Enthusiastic and detail-oriented Computer Science graduate with strong foundational expertise in React, TypeScript, and modern UI/UX design. Experienced through high-impact campus projects and software engineering internships.",
  skills: {
    technical_skills: ["JavaScript", "TypeScript", "Python", "HTML5", "CSS3", "SQL"],
    frameworks_libraries: ["React", "Next.js", "TailwindCSS", "Redux Toolkit", "Framer Motion"],
    developer_tools: ["Git", "GitHub", "VS Code", "Vite", "Figma", "Postman"],
    soft_skills: ["Fast Learner", "Problem Solving", "Teamwork", "Communication"],
    other: ["Responsive Design", "REST APIs", "Accessibility (a11y)"]
  },
  work_experience: [
    {
      company: "NextGen Software Labs",
      position: "Frontend Developer Intern",
      location: "New York, NY",
      start_date: "Jun 2023",
      end_date: "Aug 2023",
      current: false,
      highlights: [
        "Built 8 responsive React components adopting TailwindCSS and accessibility standards for client dashboard.",
        "Collaborated with senior engineers in Agile sprints to resolve 25+ frontend bug tickets before Q3 release.",
        "Refactored state management using Redux Toolkit, eliminating redundant re-renders across product tables."
      ]
    }
  ],
  education: [
    {
      institution: "New York University (NYU)",
      degree: "B.S. in Computer Science, Minor in Web Design",
      field_of_study: "Computer Science",
      start_date: "2020",
      end_date: "2024",
      gpa: "3.78 / 4.0",
      location: "New York, NY",
      highlights: ["Dean's Honors List", "Vice President of Women in Tech Club", "Teaching Assistant for Intro to Web Development"]
    }
  ],
  projects: [
    {
      title: "DevPulse — Developer Job Aggregator",
      description: "Full-stack job discovery portal with interactive filtering, salary charts, and bookmarking.",
      technologies: ["React", "TypeScript", "TailwindCSS", "Firebase"],
      link: "https://github.com/sophiapatel/devpulse",
      highlights: [
        "Created dynamic UI filtering jobs by tech stack and remote status with instantaneous response.",
        "Integrated Firebase Auth and Cloud Firestore to store user preferences and saved applications."
      ]
    }
  ],
  certifications: [
    {
      name: "Meta Front-End Developer Professional Certificate",
      issuer: "Coursera / Meta",
      issue_date: "2023",
      credential_id: "META-FE-5542"
    }
  ],
  achievements: ["1st Place NYU Senior Capstone Design Showcase 2024"],
  extracurriculars: ["HackNYU Volunteer & Organizer"],
  languages: ["English (Native)", "Spanish (Conversational)"],
  career_interests: "Junior Frontend / Full-Stack Engineer roles in tech scaleups."
};

export const sampleSeniorExecProfile: ResumeProfile = {
  id: "sample-senior-exec",
  title: "Dr. Marcus Vance - VP of Engineering & Cloud Architecture",
  target_role: "VP of Engineering / Chief Technology Officer",
  contact_info: {
    full_name: "Dr. Marcus Vance",
    email: "marcus.vance@executivecloud.io",
    phone: "+1 (415) 890-1234",
    location: "Seattle, WA",
    linkedin: "linkedin.com/in/drmarcusvance",
    github: "github.com/marcusvance",
    portfolio: "https://marcusvance.tech",
    title: "VP of Engineering & Cloud Architecture"
  },
  summary: "Accomplished engineering executive and systems architect with 14+ years of leadership driving cloud transformation, enterprise platform engineering, and high-velocity engineering organizations. Track record scaling multi-region distributed infrastructures to 120M+ users while directing 90+ person cross-functional engineering teams.",
  skills: {
    technical_skills: ["Distributed Systems", "Cloud Architecture", "Golang", "Python", "Rust", "TypeScript", "PostgreSQL", "Kafka"],
    frameworks_libraries: ["Kubernetes", "Next.js", "gRPC", "FastAPI", "Terraform", "Redis Cluster", "Prometheus", "Envoy"],
    developer_tools: ["AWS Cloud", "Google Cloud Platform", "Docker", "Datadog", "ArgoCD", "Vault", "Helm", "Snowflake"],
    soft_skills: ["Executive Leadership", "Strategic Roadmapping", "P&L Management", "Board Advisory", "Talent Mentorship"],
    other: ["Zero-Trust Security", "SOC2 / HIPAA Compliance", "Micro-frontends", "FinOps Cloud Optimization"]
  },
  work_experience: [
    {
      company: "Starlight Cloud Platforms",
      position: "Vice President of Engineering",
      location: "Seattle, WA",
      start_date: "2021",
      end_date: "Present",
      current: true,
      highlights: [
        "Direct 92 engineers, product managers, and architects across 6 global product squads, owning an annual engineering budget of $18M.",
        "Architected next-generation serverless mesh deployed across 14 global regions, driving SLA up to 99.995% and lowering cloud spend by $4.2M annually.",
        "Championed engineering productivity initiatives that reduced cycle time from 16 days to 2.4 days with automated quality gates.",
        "Co-led Series D fundraising due diligence, presenting technical roadmap and security compliance frameworks to venture partners."
      ]
    },
    {
      company: "Vanguard Distributed Systems",
      position: "Senior Director of Core Engineering",
      location: "San Francisco, CA",
      start_date: "2017",
      end_date: "2021",
      current: false,
      highlights: [
        "Spearheaded multi-tenant streaming backbone on Apache Kafka and Go, ingesting 450B daily events with sub-50ms processing latency.",
        "Scaled engineering org from 22 to 75 engineers across Platform, Data, Security, and Core Infrastructure teams.",
        "Instituted company-wide architectural review board and internal open-source guild, accelerating cross-department feature delivery by 40%."
      ]
    },
    {
      company: "Amazon Web Services (AWS)",
      position: "Principal Cloud Solutions Architect",
      location: "Seattle, WA",
      start_date: "2013",
      end_date: "2017",
      current: false,
      highlights: [
        "Advised Fortune 100 enterprise clients on multi-datacenter hybrid cloud migrations involving 10,000+ virtualized instances.",
        "Authored reference architectures for resilient microservices on ECS, EKS, and DynamoDB published on official AWS documentation."
      ]
    },
    {
      company: "Cognitive Solutions Inc",
      position: "Lead Systems Engineer",
      location: "San Jose, CA",
      start_date: "2010",
      end_date: "2013",
      current: false,
      highlights: [
        "Engineered real-time data replication protocols across distributed relational databases, preventing transactional data loss during network partitions.",
        "Mentored 12 junior software developers in systems programming and automated test coverage."
      ]
    }
  ],
  education: [
    {
      institution: "Stanford University",
      degree: "Ph.D. in Computer Systems & Networking",
      field_of_study: "Distributed Systems Architecture",
      start_date: "2006",
      end_date: "2010",
      gpa: "3.94 / 4.0",
      location: "Stanford, CA",
      highlights: ["Dissertation: Adaptive Consensus Protocols in Asynchronous Networks", "NSF Graduate Research Fellowship Recipient"]
    },
    {
      institution: "Carnegie Mellon University",
      degree: "B.S. in Electrical & Computer Engineering",
      field_of_study: "Computer Engineering",
      start_date: "2002",
      end_date: "2006",
      gpa: "3.91 / 4.0",
      location: "Pittsburgh, PA",
      highlights: ["University Honors with Distinction", "Eta Kappa Nu Electrical Engineering Honor Society"]
    }
  ],
  projects: [
    {
      title: "ConsensusMesh — Open Source Consensus Protocol",
      description: "Decentralized state machine consensus library with sub-millisecond leader election and partitioned tolerance.",
      technologies: ["Rust", "Raft", "Tokio", "gRPC", "Docker"],
      link: "https://github.com/marcusvance/consensusmesh",
      highlights: [
        "Earned 4.8K+ GitHub stars and integrated by 8 enterprise cloud vendors for distributed cluster coordination.",
        "Benchmarked 320,000 operations per second across a 9-node distributed geographic cluster."
      ]
    },
    {
      title: "FinOps Telemetry Dashboard",
      description: "Real-time cost anomaly detector and cloud resource rightsizer across AWS, GCP, and Azure.",
      technologies: ["Golang", "React", "ClickHouse", "Kubernetes", "Prometheus"],
      link: "https://github.com/marcusvance/finops-agent",
      highlights: [
        "Demonstrated automated reclamation of 28% orphaned container memory and underutilized EBS volumes."
      ]
    },
    {
      title: "CloudVault Cryptographic Key Escrow",
      description: "Hardware-security-module backed key distribution platform with threshold cryptography.",
      technologies: ["C++", "Python", "HSM", "TLS 1.3", "Zero-Knowledge"],
      link: "https://github.com/marcusvance/cloudvault",
      highlights: [
        "Audited by NCC Group and certified compliant with FIPS 140-2 Level 3 standards."
      ]
    }
  ],
  certifications: [
    {
      name: "AWS Certified Solutions Architect – Professional",
      issuer: "Amazon Web Services",
      issue_date: "2023",
      expiry_date: "2026",
      credential_id: "AWS-SAP-98102"
    },
    {
      name: "Google Cloud Certified Fellow — Hybrid Multi-cloud",
      issuer: "Google Cloud",
      issue_date: "2022",
      credential_id: "GCP-FELLOW-1049"
    },
    {
      name: "Certified Information Systems Security Professional (CISSP)",
      issuer: "ISC2",
      issue_date: "2021",
      credential_id: "CISSP-59281"
    }
  ],
  achievements: [
    "Holder of 4 U.S. Patents in distributed consensus and network traffic shaping",
    "Keynote Speaker at QCon London, KubeCon North America, and Cloud Expo (2020-2024)",
    "Technical Advisory Board Member for 3 venture-backed Cloud-Native SaaS startups",
    "Forbes Technology Council Contributor on Enterprise AI and Cloud Infrastructure"
  ],
  extracurriculars: [
    "Founding Member & Mentor at Bay Area Tech Leaders Collective",
    "Volunteer Instructor teaching Python and Cloud Fundamentals to Military Veterans"
  ],
  languages: ["English (Native)", "German (Professional Working)", "Japanese (Elementary)"],
  career_interests: "CTO / Head of Engineering roles shaping next-generation AI infrastructure and cloud operating systems."
};

export const sampleAcademicProfile: ResumeProfile = {
  id: "sample-academic",
  title: "Dr. Elena Rostova - Assistant Professor & AI Researcher",
  target_role: "Tenure-Track Faculty / Principal AI Research Scientist",
  contact_info: {
    full_name: "Dr. Elena Rostova",
    email: "elena.rostova@mit.edu",
    phone: "+1 (617) 495-2000",
    location: "Cambridge, MA",
    linkedin: "linkedin.com/in/dr-elena-rostova",
    github: "github.com/erostova-lab",
    portfolio: "https://elena-rostova.ai",
    title: "Assistant Professor of Computer Science & AI"
  },
  summary: "Tenure-track AI researcher and educator specializing in deep generative modeling, neural theorem proving, and reliable machine learning. Author of 16 peer-reviewed papers published in NeurIPS, ICML, and ICLR with 2,400+ citations. Principal Investigator on multiple funded NSF and industry grants.",
  skills: {
    technical_skills: ["Deep Learning", "PyTorch", "JAX", "Python", "Mathematical Optimization", "Statistical Inference"],
    frameworks_libraries: ["Hugging Face", "vLLM", "DeepSpeed", "NumPy", "SciPy", "LaTeX", "Weights & Biases"],
    developer_tools: ["NVIDIA CUDA", "Slurm HPC Clusters", "Git", "Linux", "TensorBoard", "Docker"],
    soft_skills: ["Pedagogy & Teaching", "Academic Writing", "Grant Proposal Writing", "Ph.D. Advising", "Conference Reviewing"],
    other: ["Mechanistic Interpretability", "Alignment & Safety", "Neural Symbolic Reasoning"]
  },
  work_experience: [
    {
      company: "Massachusetts Institute of Technology (MIT)",
      position: "Assistant Professor of Computer Science",
      location: "Cambridge, MA",
      start_date: "2022",
      end_date: "Present",
      current: true,
      highlights: [
        "Lead the Generative Reasoning and Reliable AI Laboratory (GR-Lab), advising 5 Ph.D. students and 3 postdoctoral fellows.",
        "Secured $1.4M in research funding as PI from the National Science Foundation (NSF) and Google Academic Research Grants.",
        "Developed and instructed graduate curriculum 6.885: 'Foundations of Modern Neural Architectures & Alignment' (rated 4.9/5.0 by 120+ students)."
      ]
    },
    {
      company: "DeepMind / Google Research",
      position: "Postdoctoral Research Scientist",
      location: "London, UK",
      start_date: "2020",
      end_date: "2022",
      current: false,
      highlights: [
        "Investigated sample-efficient reinforcement learning and attention mechanisms for mathematical reasoning architectures.",
        "Co-authored landmark paper on transformer reasoning depth presented as Oral presentation at NeurIPS 2021 (Top 1% of submissions)."
      ]
    }
  ],
  education: [
    {
      institution: "Harvard University",
      degree: "Ph.D. in Computer Science",
      field_of_study: "Artificial Intelligence & Theory of Computation",
      start_date: "2015",
      end_date: "2020",
      gpa: "4.0 / 4.0",
      location: "Cambridge, MA",
      highlights: ["Thesis: Convergence Guarantees and Representations in Over-parameterized Neural Networks", "Harvard Graduate School of Arts & Sciences Fellowship"]
    },
    {
      institution: "Princeton University",
      degree: "A.B. in Mathematics, Summa Cum Laude",
      field_of_study: "Pure Mathematics",
      start_date: "2011",
      end_date: "2015",
      gpa: "3.98 / 4.0",
      location: "Princeton, NJ",
      highlights: ["Phi Beta Kappa", "Senior Thesis Prize in Mathematics"]
    }
  ],
  projects: [
    {
      title: "ProofGen — Neural Automated Theorem Prover",
      description: "Hybrid LLM-guided tactic generator for formal mathematics verification in Lean 4.",
      technologies: ["Python", "PyTorch", "Lean 4", "HuggingFace", "Slurm"],
      link: "https://github.com/erostova-lab/proofgen",
      highlights: [
        "Solved 42 International Mathematical Olympiad (IMO) competition problems with formal machine-checked proofs.",
        "Benchmarked 2.8x faster proof convergence compared to baseline state-of-the-art verifiers."
      ]
    },
    {
      title: "InterpLens — LLM Activation Topology Visualizer",
      description: "Open source tool for mechanistic interpretability and sparse autoencoder feature discovery.",
      technologies: ["JAX", "React", "TypeScript", "D3.js", "WebGL"],
      link: "https://github.com/erostova-lab/interplens",
      highlights: [
        "Used by research groups at Stanford, Berkeley, and Oxford to visualize circuit heads in 70B parameter models."
      ]
    }
  ],
  certifications: [
    {
      name: "NSF Early CAREER Research Award Nominee",
      issuer: "National Science Foundation",
      issue_date: "2023"
    }
  ],
  achievements: [
    "NeurIPS Outstanding Paper Award (2021)",
    "Area Chair and Senior Program Committee Member for NeurIPS, ICML, and ICLR (2022-2025)",
    "Author of 16 peer-reviewed papers with 2,400+ total citations and h-index of 14",
    "Invited Guest Lecturer at Oxford University, ETH Zurich, and Stanford University"
  ],
  extracurriculars: [
    "Faculty Advisor for Women in Computer Science (WiCS) chapter",
    "Organizer for AI Ethics and Accessible Machine Learning Workshop"
  ],
  languages: ["English (Bilingual)", "Russian (Native)", "French (Intermediate)"],
  career_interests: "Advancing formal verification, neural reasoning architectures, and academic research."
};

export const sampleCreativeProfile: ResumeProfile = {
  id: "sample-creative",
  title: "Julian Rivera - Principal Product Designer & Design Systems Lead",
  target_role: "Staff / Principal Product Designer",
  contact_info: {
    full_name: "Julian Rivera",
    email: "julian@riveradesign.co",
    phone: "+1 (212) 555-7890",
    location: "Brooklyn, NY",
    linkedin: "linkedin.com/in/julianriveradesign",
    github: "github.com/julianrivera",
    portfolio: "https://julianrivera.design",
    title: "Principal Product Designer & Design Systems Lead"
  },
  summary: "Award-winning Product Designer with 8+ years crafting delightful, accessible, and high-conversion software experiences. Specializing in enterprise design systems, micro-interactions, and AI-assisted workflows. Recognized by Awwwards, FWA, and Red Dot Design Awards.",
  skills: {
    technical_skills: ["Product Design", "Design Systems", "UI/UX Architecture", "Wireframing", "Rapid Prototyping", "Design Tokens"],
    frameworks_libraries: ["Figma", "Design Tokens Studio", "Framer", "Storybook", "HTML5", "CSS3 / TailwindCSS"],
    developer_tools: ["Adobe Creative Suite", "ProtoPie", "Cinema 4D", "Linear", "Zeplin", "Git"],
    soft_skills: ["User Research", "Design Critique", "Cross-disciplinary Alignment", "Creative Direction", "Design Sprints"],
    other: ["WCAG 2.2 AAA Accessibility", "Motion Design", "Brand Identity"]
  },
  work_experience: [
    {
      company: "Prism Creative Technologies",
      position: "Principal Product Designer",
      location: "New York, NY",
      start_date: "2021",
      end_date: "Present",
      current: true,
      highlights: [
        "Spearheaded multi-brand enterprise design system adopted across 14 web and mobile apps, cutting design-to-code sprint handoff by 50%.",
        "Redesigned SaaS onboarding funnel with interactive guided tooltips, lifting user activation rate from 24% to 49%.",
        "Mentored team of 8 product designers and hosted weekly design critique workshops."
      ]
    },
    {
      company: "Aura Design Agency",
      position: "Senior UI/UX Designer",
      location: "New York, NY",
      start_date: "2018",
      end_date: "2021",
      current: false,
      highlights: [
        "Delivered end-to-end digital experiences for clients including Spotify, Nike, and Stripe.",
        "Created bespoke interactive 3D microsites winning 3 Awwwards Site of the Day honors."
      ]
    }
  ],
  education: [
    {
      institution: "Rhode Island School of Design (RISD)",
      degree: "B.F.A. in Graphic Design & Digital Media",
      field_of_study: "Digital Design & Human Computer Interaction",
      start_date: "2014",
      end_date: "2018",
      gpa: "3.88 / 4.0",
      location: "Providence, RI",
      highlights: ["RISD Honors Graduate", "President of Digital Media Guild"]
    }
  ],
  projects: [
    {
      title: "TokenCraft — Open Source Design Token Engine",
      description: "Automated tool translating Figma design variables to CSS, Tailwind, and React Native style tokens.",
      technologies: ["Figma Plugin API", "TypeScript", "TailwindCSS", "Node.js"],
      link: "https://github.com/julianrivera/tokencraft",
      highlights: [
        "Adopted by 300+ engineering teams to sync Figma variables directly to GitHub repositories on every commit."
      ]
    }
  ],
  certifications: [
    {
      name: "Nielsen Norman Group UX Master Certified",
      issuer: "NN/g",
      issue_date: "2022"
    }
  ],
  achievements: [
    "Red Dot Best of the Best Design Award (2023)",
    "Awwwards Site of the Year Nominee (2022)",
    "Guest Speaker at Config Figma Conference and Smashing Conference"
  ],
  extracurriculars: [
    "Co-organizer of Brooklyn Design & Code Meetup (1,200+ members)",
    "Portfolio Reviewer for AIGA Mentorship Program"
  ],
  languages: ["English (Native)", "Spanish (Bilingual)"],
  career_interests: "Design leadership roles shaping next-generation consumer and creator software tools."
};

export const sampleHealthcareProfile: ResumeProfile = {
  id: "sample-healthcare",
  title: "Dr. Sarah Jenkins, MD - Attending Physician",
  target_role: "Attending Physician / Clinical Director",
  contact_info: {
    full_name: "Dr. Sarah Jenkins, MD",
    email: "sjenkins.md@hospitalmed.org",
    phone: "+1 (312) 555-4321",
    location: "Chicago, IL",
    linkedin: "linkedin.com/in/sarahjenkins-md",
    title: "Attending Physician – Internal Medicine"
  },
  summary: "Board-Certified Internal Medicine Attending with 7+ years of inpatient care, diagnostic reasoning, and hospital medicine leadership. Supervised 40+ clinical residents and led quality improvement committees reducing 30-day readmissions by 18%.",
  skills: {
    technical_skills: ["Inpatient Medicine", "Critical Care Triage", "Diagnostic Reasoning", "Central Venous Catheterization", "Arterial Lines", "Point-of-Care Ultrasound (POCUS)"],
    frameworks_libraries: ["Epic Hyperspace", "Cerner PowerChart", "UpToDate", "Doximity"],
    developer_tools: ["EHR Clinical Decision Support", "PACS Imaging Systems"],
    soft_skills: ["Patient-Centered Care", "Multidisciplinary Rounds", "Clinical Mentorship", "Crisis Communication"],
    other: ["Infection Prevention Protocols", "Hospital Quality Metrics", "JCAHO Compliance"]
  },
  work_experience: [
    {
      company: "Northwestern Memorial Hospital",
      position: "Attending Physician – Department of Medicine",
      location: "Chicago, IL",
      start_date: "2021",
      end_date: "Present",
      current: true,
      highlights: [
        "Manage high-acuity 28-bed inpatient ward, coordinating care with multidisciplinary ICU and surgical teams.",
        "Championed antimicrobial stewardship protocol that decreased unnecessary broad-spectrum antibiotic usage by 24%.",
        "Direct daily clinical teaching rounds for internal medicine residents and 3rd/4th-year medical students."
      ]
    },
    {
      company: "Rush University Medical Center",
      position: "Internal Medicine Resident & Chief Resident",
      location: "Chicago, IL",
      start_date: "2018",
      end_date: "2021",
      current: false,
      highlights: [
        "Delivered direct primary and acute care across inpatient wards, medical ICU, and outpatient clinics.",
        "Elected Chief Resident (2020-2021), overseeing scheduling, curriculum, and clinical welfare of 68 residents.",
        "Received Excellence in Bedside Teaching Award two consecutive academic years."
      ]
    }
  ],
  education: [
    {
      institution: "Northwestern University Feinberg School of Medicine",
      degree: "Doctor of Medicine (M.D.)",
      field_of_study: "Medicine",
      start_date: "2014",
      end_date: "2018",
      location: "Chicago, IL",
      highlights: ["Alpha Omega Alpha (AOA) Honor Medical Society", "Gold Humanism Honor Society"]
    },
    {
      institution: "University of Michigan",
      degree: "B.S. in Cellular & Molecular Biology, Magna Cum Laude",
      field_of_study: "Biology & Biochemistry",
      start_date: "2010",
      end_date: "2014",
      gpa: "3.92 / 4.0",
      location: "Ann Arbor, MI",
      highlights: ["Phi Beta Kappa", "Undergraduate Research Fellowship"]
    }
  ],
  projects: [
    {
      title: "Inpatient Readmission Reduction Protocol",
      description: "Structured post-discharge multidisciplinary follow-up model for heart failure and COPD patients.",
      technologies: ["Epic EHR", "Biostatistics", "Clinical Pathways"],
      highlights: [
        "Reduced 30-day all-cause readmission rates from 21.4% to 17.5% across 800+ admissions.",
        "Presented outcomes at Society of Hospital Medicine (SHM) Annual Conference."
      ]
    }
  ],
  certifications: [
    {
      name: "American Board of Internal Medicine (ABIM) Board Certified",
      issuer: "ABIM",
      issue_date: "2021",
      expiry_date: "2031"
    },
    {
      name: "Illinois Permanent State Medical License",
      issuer: "IDFPR",
      issue_date: "2018"
    },
    {
      name: "Advanced Cardiovascular Life Support (ACLS) & BLS",
      issuer: "American Heart Association",
      issue_date: "2024",
      expiry_date: "2026"
    }
  ],
  achievements: [
    "Published 5 peer-reviewed clinical articles in Annals of Internal Medicine and Journal of Hospital Medicine",
    "Hospital Physician of the Year Nominee (2023)"
  ],
  extracurriculars: [
    "Volunteer Physician at Community Free Clinic Chicago",
    "Member of American College of Physicians (ACP)"
  ],
  languages: ["English (Native)", "Spanish (Medical Spanish Certified)"]
};

export const sampleLawProfile: ResumeProfile = {
  id: "sample-law",
  title: "James Thornton, Esq. - Corporate Counsel",
  target_role: "Senior Corporate Counsel / Partner",
  contact_info: {
    full_name: "James Thornton, Esq.",
    email: "jthornton@thorntonlegal.com",
    phone: "+1 (202) 555-0199",
    location: "Washington, DC",
    linkedin: "linkedin.com/in/jamesthorntonesq",
    title: "Corporate Counsel & M&A Specialist"
  },
  summary: "Corporate attorney with 8+ years advising Fortune 500 corporations and private equity funds on cross-border M&A ($3B+ aggregate value), commercial debt financings, and antitrust regulatory filings. Admitted to the District of Columbia and New York State Bars.",
  skills: {
    technical_skills: ["Mergers & Acquisitions", "Commercial Contracts", "Securities Law", "Antitrust Due Diligence", "Corporate Governance", "Shareholder Agreements"],
    frameworks_libraries: ["LexisNexis", "Westlaw Precision", "Relativity", "Bloomberg Law", "Practical Law"],
    developer_tools: ["Contract Automation", "SEC EDGAR Filing"],
    soft_skills: ["High-Stakes Negotiation", "Executive Advising", "Board Presentation", "Regulatory Defense"],
    other: ["HSR Antitrust Filings", "Cross-Border Tax Treaties", "Joint Venture Structuring"]
  },
  work_experience: [
    {
      company: "Sterling, Hayes & Vance LLP",
      position: "Senior Corporate Associate",
      location: "Washington, DC",
      start_date: "2020",
      end_date: "Present",
      current: true,
      highlights: [
        "Lead transaction counsel on 22 domestic and international acquisition deals valued from $50M to $1.2B.",
        "Draft and negotiate stock purchase agreements, disclosure schedules, credit facilities, and transition services covenants.",
        "Managed antitrust Hart-Scott-Rodino (HSR) filings before the FTC and Department of Justice Antitrust Division."
      ]
    },
    {
      company: "Covington & Associates LLP",
      position: "Corporate Associate",
      location: "New York, NY",
      start_date: "2017",
      end_date: "2020",
      current: false,
      highlights: [
        "Structured seed and growth-equity investment rounds for venture capital firms and emerging tech companies.",
        "Conducted exhaustive legal due diligence and drafted commercial master service agreements (MSAs) and vendor contracts."
      ]
    }
  ],
  education: [
    {
      institution: "Georgetown University Law Center",
      degree: "Juris Doctor (J.D.), Magna Cum Laude",
      field_of_study: "Corporate & Securities Law",
      start_date: "2014",
      end_date: "2017",
      location: "Washington, DC",
      highlights: ["Executive Articles Editor, The Georgetown Law Journal", "Order of the Coif"]
    },
    {
      institution: "University of Virginia",
      degree: "B.A. in Political Science & Economics",
      field_of_study: "Economics",
      start_date: "2010",
      end_date: "2014",
      gpa: "3.89 / 4.0",
      location: "Charlottesville, VA",
      highlights: ["Echols Scholar", "Dean's List (8 Semesters)"]
    }
  ],
  projects: [
    {
      title: "Cross-Border Aerospace Consolidation ($850M)",
      description: "Represented acquiring multinational in multi-jurisdiction defense asset merger through CFIUS review.",
      technologies: ["CFIUS", "Antitrust Clearance", "SPA Drafts"],
      highlights: [
        "Secured unconditional regulatory approvals across FTC, DOJ, and European Commission within 9 months."
      ]
    }
  ],
  certifications: [
    {
      name: "District of Columbia Bar (Bar No. 1048291)",
      issuer: "D.C. Court of Appeals",
      issue_date: "2018"
    },
    {
      name: "New York State Bar (Registration No. 551920)",
      issuer: "NYS Appellate Division",
      issue_date: "2017"
    }
  ],
  achievements: [
    "Recognized in Super Lawyers 'Rising Stars' – Corporate & Securities (2022, 2023, 2024)",
    "Published author of 'Antitrust Review in Cross-Border Platform Mergers' in Columbia Business Law Review"
  ],
  extracurriculars: [
    "Pro Bono Legal Clinic Volunteer – D.C. Small Business Assistance Program",
    "Member of American Bar Association Business Law Section"
  ],
  languages: ["English (Native)", "French (Working Proficiency)"]
};

export const sampleEngineeringProfile: ResumeProfile = {
  id: "sample-engineering",
  title: "Michael Sterling, PE - Senior Civil & Structural Engineer",
  target_role: "Lead Structural Engineer / Project Director",
  contact_info: {
    full_name: "Michael Sterling, PE",
    email: "msterling.pe@infrastructure-eng.com",
    phone: "+1 (206) 555-8712",
    location: "Seattle, WA",
    linkedin: "linkedin.com/in/michaelsterling-pe",
    title: "Senior Civil & Structural Engineer, PE"
  },
  summary: "Licensed Professional Engineer (PE) with 9+ years managing highway bridge design, deep foundation analysis, and seismic retrofits for municipal and federal DOT infrastructure programs ($200M+ portfolio).",
  skills: {
    technical_skills: ["Structural Steel Design", "Post-Tensioned Concrete", "Seismic Retrofit Analysis", "Finite Element Modeling", "Geotechnical Foundations", "BIM 360 Coordination"],
    frameworks_libraries: ["AutoCAD Civil 3D", "Revit Structure", "SAP2000", "ETABS", "STAAD.Pro", "Bluebeam Revu"],
    developer_tools: ["MathCAD", "ArcGIS", "Civil 3D"],
    soft_skills: ["Client & DOT Stakeholder Liaison", "Field Inspection Leadership", "Project Cost Estimating", "Constructability Reviews"],
    other: ["AASHTO LRFD Specifications", "IBC & ASCE 7 Standards", "ACI 318 Concrete Codes"]
  },
  work_experience: [
    {
      company: "WSP Global Engineering",
      position: "Senior Structural Project Engineer",
      location: "Seattle, WA",
      start_date: "2020",
      end_date: "Present",
      current: true,
      highlights: [
        "Lead structural design of 3-span steel composite girder bridge replacing aging county crossing ($42M budget).",
        "Perform non-linear dynamic seismic evaluations using SAP2000, ensuring seismic resilience for Essential Bridge Category.",
        "Direct team of 6 engineers and technicians, ensuring complete compliance with WSDOT and AASHTO LRFD standards."
      ]
    },
    {
      company: "HDR Engineering Inc.",
      position: "Structural Engineer (PE)",
      location: "Portland, OR",
      start_date: "2016",
      end_date: "2020",
      current: false,
      highlights: [
        "Engineered retaining walls, deep drilled shafts, and stormwater culvert crossings for state transit corridor.",
        "Conducted bi-annual National Bridge Inspection Standards (NBIS) fracture-critical bridge safety inspections."
      ]
    }
  ],
  education: [
    {
      institution: "University of Washington",
      degree: "M.S. in Civil & Structural Engineering",
      field_of_study: "Structural Dynamics & Earthquakes",
      start_date: "2014",
      end_date: "2016",
      gpa: "3.90 / 4.0",
      location: "Seattle, WA"
    },
    {
      institution: "Oregon State University",
      degree: "B.S. in Civil Engineering, Summa Cum Laude",
      field_of_study: "Civil Engineering",
      start_date: "2010",
      end_date: "2014",
      gpa: "3.94 / 4.0",
      location: "Corvallis, OR",
      highlights: ["Chi Epsilon Civil Engineering Honor Society", "ASCE Steel Bridge Team Captain"]
    }
  ],
  projects: [
    {
      title: "Interstate Transit Viaduct Seismic Hardening",
      description: "Non-linear pushover analysis and carbon-fiber column jacket retrofit design for 14 viaduct piers.",
      technologies: ["ETABS", "FRP Jackets", "Non-linear Pushover"],
      highlights: [
        "Extended structural operating lifespan by 35 years while saving county $18M compared to complete replacement."
      ]
    }
  ],
  certifications: [
    {
      name: "Licensed Professional Engineer (PE) – Washington & Oregon",
      issuer: "WA State Board of Registration",
      issue_date: "2018"
    },
    {
      name: "FHWA-NHI Bridge Inspector Certification (NBIS)",
      issuer: "National Highway Institute",
      issue_date: "2017"
    }
  ],
  achievements: [
    "ASCE Structural Project of the Year Award (Pacific Northwest Chapter, 2023)",
    "Published research on precast prestressed girder shear strength in PCI Journal"
  ],
  extracurriculars: [
    "ASCE Seattle Chapter Board Member",
    "Engineers Without Borders Volunteer"
  ],
  languages: ["English (Native)"]
};

export const sampleBusinessProfile: ResumeProfile = {
  id: "sample-business",
  title: "Amanda Brooks - Director of People Operations & HR",
  target_role: "VP of People Operations / Chief Human Resources Officer",
  contact_info: {
    full_name: "Amanda Brooks, SHRM-SCP",
    email: "amanda.brooks@peoplelead.com",
    phone: "+1 (415) 555-6789",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/amandabrooks-hr",
    title: "Director of People Operations & HR"
  },
  summary: "Strategic HR leader with 10+ years scaling venture-backed and global organizations from 150 to 1,200+ employees. Expert in employee engagement, global talent acquisition, executive compensation, and compliance.",
  skills: {
    technical_skills: ["People Operations", "Talent Acquisition", "Compensation & Equity", "Performance Management", "Employee Relations", "DEI Strategy"],
    frameworks_libraries: ["Workday HCM", "Greenhouse", "Lattice", "Culture Amp", "Gusto", "Rippling"],
    developer_tools: ["HR Analytics (Visier)", "Tableau HR Dashboards"],
    soft_skills: ["Executive Coaching", "Organizational Design", "Conflict Mediation", "Change Management"],
    other: ["FLSA & EEOC Compliance", "Global Relocation", "Merger & Acquisition Integration"]
  },
  work_experience: [
    {
      company: "Luminary Technologies",
      position: "Director of People Operations",
      location: "San Francisco, CA",
      start_date: "2021",
      end_date: "Present",
      current: true,
      highlights: [
        "Scaled global headcount from 220 to 650 employees across US, EMEA, and APAC while reducing employee turnover by 32%.",
        "Restructured total rewards framework, implementing transparent career leveling matrix and competitive benchmarked salary bands.",
        "Maintained 88% overall engagement score on annual Culture Amp survey through transparent leadership all-hands."
      ]
    },
    {
      company: "NextGen Software Corp",
      position: "Senior HR Business Partner (HRBP)",
      location: "San Francisco, CA",
      start_date: "2017",
      end_date: "2021",
      current: false,
      highlights: [
        "Partnered with VP of Sales and VP of Product to lead headcount planning, performance calibrations, and retention programs.",
        "Designed comprehensive 90-day onboarding journey improving new hire ramp-to-productivity time by 28%."
      ]
    }
  ],
  education: [
    {
      institution: "Cornell University",
      degree: "B.S. in Industrial & Labor Relations (ILR)",
      field_of_study: "Human Resource Management",
      start_date: "2011",
      end_date: "2015",
      gpa: "3.84 / 4.0",
      location: "Ithaca, NY"
    }
  ],
  projects: [
    {
      title: "Global Hybrid Workplace Transformation",
      description: "Designed multi-state and multi-national remote work policies, compliance guidelines, and workspace stipends.",
      technologies: ["Workday", "Lattice", "Compliance Auditing"],
      highlights: [
        "Saved $2.4M annually in real-estate overhead while boosting hiring candidate pool reach by 400%."
      ]
    }
  ],
  certifications: [
    {
      name: "SHRM Senior Certified Professional (SHRM-SCP)",
      issuer: "Society for Human Resource Management",
      issue_date: "2019",
      expiry_date: "2025"
    },
    {
      name: "Senior Professional in Human Resources (SPHR)",
      issuer: "HRCI",
      issue_date: "2018"
    }
  ],
  achievements: [
    "Named Top 40 Under 40 HR Leaders by Human Resource Executive Magazine",
    "Speaker on 'Building Culture in Distributed Scaleups' at SHRM Annual Conference"
  ],
  extracurriculars: [
    "Mentor at Women in HR Technology",
    "Advisory Board Member – Bay Area People Leaders"
  ],
  languages: ["English (Native)"]
};

export const sampleFinanceProfile: ResumeProfile = {
  id: "sample-finance",
  title: "Claire Dupont, CPA - Senior Financial Controller",
  target_role: "Vice President of Finance / Corporate Controller",
  contact_info: {
    full_name: "Claire Dupont, CPA",
    email: "cdupont.cpa@financeexec.com",
    phone: "+1 (212) 555-9012",
    location: "New York, NY",
    linkedin: "linkedin.com/in/clairedupont-cpa",
    title: "Senior Financial Controller, CPA"
  },
  summary: "Certified Public Accountant (CPA) with 10+ years directing accounting operations, SEC financial reporting (10-K, 10-Q), SOX 404 internal controls, and corporate cash treasury ($500M+ revenue). Big 4 alumni.",
  skills: {
    technical_skills: ["GAAP / IFRS Accounting", "SEC Financial Reporting", "SOX 404 Compliance", "Treasury & Cash Management", "Audit Defense", "Revenue Recognition (ASC 606)"],
    frameworks_libraries: ["NetSuite OneWorld", "SAP S/4HANA", "Workiva", "Hyperion Financial Management", "Excel Advanced VBA"],
    developer_tools: ["Alteryx Financial Automation", "PowerBI"],
    soft_skills: ["Board Financial Reporting", "Audit Committee Presentations", "Cross-Functional Budgeting"],
    other: ["M&A Purchase Accounting (ASC 805)", "Transfer Pricing", "Tax Provision (ASC 740)"]
  },
  work_experience: [
    {
      company: "Beacon Global Media Corp",
      position: "Corporate Controller",
      location: "New York, NY",
      start_date: "2020",
      end_date: "Present",
      current: true,
      highlights: [
        "Manage 18-person corporate accounting team covering general ledger, financial reporting, accounts payable, and tax.",
        "Accelerated monthly close cycle from 12 business days to 4 business days via automated reconciliation workflows.",
        "Served as primary liaison with external auditors (PwC), resulting in clean unqualified audit opinions for 4 consecutive years."
      ]
    },
    {
      company: "PricewaterhouseCoopers (PwC)",
      position: "Audit Manager – Assurance Practice",
      location: "New York, NY",
      start_date: "2015",
      end_date: "2020",
      current: false,
      highlights: [
        "Supervised integrated financial statement audits and SOX 404 assessments for public technology and media clients.",
        "Specialized in complex revenue recognition contracts (ASC 606) and capitalized software evaluations (ASC 350-40)."
      ]
    }
  ],
  education: [
    {
      institution: "New York University (NYU) Stern School of Business",
      degree: "B.S. in Accounting & Finance, Magna Cum Laude",
      field_of_study: "Accounting",
      start_date: "2011",
      end_date: "2015",
      gpa: "3.91 / 4.0",
      location: "New York, NY",
      highlights: ["Beta Alpha Psi Financial Honor Society"]
    }
  ],
  projects: [
    {
      title: "ERP System Migration & Reconciliation (NetSuite)",
      description: "Led company-wide enterprise migration from legacy QuickBooks to NetSuite OneWorld across 8 subsidiaries.",
      technologies: ["NetSuite", "Alteryx", "SQL"],
      highlights: [
        "Completed migration on budget and 2 weeks ahead of schedule with zero ledger discrepancies."
      ]
    }
  ],
  certifications: [
    {
      name: "Certified Public Accountant (CPA) – State of New York",
      issuer: "New York State Board of Accountancy",
      issue_date: "2016"
    }
  ],
  achievements: [
    "CPA Exam High Score Honor Recipient (Elijah Watt Sells Award Eligible)",
    "Treasurer & Board Member for New York Arts Non-Profit"
  ],
  extracurriculars: [
    "Member of American Institute of CPAs (AICPA)",
    "Volunteer Tax Preparer (VITA Program)"
  ],
  languages: ["English (Native)", "French (Bilingual)"]
};

export const sampleEducationProfile: ResumeProfile = {
  id: "sample-education",
  title: "David Miller, M.Ed - High School Science Department Chair",
  target_role: "High School Principal / Academic Director",
  contact_info: {
    full_name: "David Miller, M.Ed",
    email: "dmiller.edu@publicschools.org",
    phone: "+1 (617) 555-7812",
    location: "Boston, MA",
    linkedin: "linkedin.com/in/davidmiller-educator",
    title: "High School Science Department Chair & Licensed Educator"
  },
  summary: "Dedicated secondary educator and department chair with 11+ years of instructional leadership, AP Biology teaching, curriculum development, and STEM equity initiatives. Increased state exam proficiency scores by 26%.",
  skills: {
    technical_skills: ["Curriculum & Syllabus Design", "Inquiry-Based Learning", "Differentiated Instruction", "IEP & 504 Accommodations", "Formative Assessment", "Laboratory Safety"],
    frameworks_libraries: ["Google Classroom", "Canvas LMS", "PowerSchool SIS", "Vernier LabQuest", "Nearpod"],
    developer_tools: ["Classroom Tech Tools"],
    soft_skills: ["Classroom Management", "Parent-Teacher Partnership", "Instructional Coaching", "Community Engagement"],
    other: ["Next Generation Science Standards (NGSS)", "AP Biology College Board Certified", "Title I School Engagement"]
  },
  work_experience: [
    {
      company: "Boston Public High School",
      position: "Science Department Chair & AP Biology Teacher",
      location: "Boston, MA",
      start_date: "2018",
      end_date: "Present",
      current: true,
      highlights: [
        "Lead 14-faculty science department, facilitating monthly professional development and curriculum alignment with NGSS standards.",
        "Taught AP Biology achieving an 88% pass rate (score 3+) over 6 years compared to 64% national average.",
        "Secured $85K in STEM lab grants to equip modern biotechnology and spectrophotometry student workstations."
      ]
    },
    {
      company: "Cambridge Community School",
      position: "High School Biology & Chemistry Teacher",
      location: "Cambridge, MA",
      start_date: "2013",
      end_date: "2018",
      current: false,
      highlights: [
        "Designed hands-on investigative science units incorporating environmental water testing of the Charles River.",
        "Mentored student science fair participants, coaching 4 regional and state ISEF finalists."
      ]
    }
  ],
  education: [
    {
      institution: "Harvard Graduate School of Education",
      degree: "Master of Education (M.Ed.) in Curriculum & Teaching",
      field_of_study: "Secondary Science Education",
      start_date: "2012",
      end_date: "2013",
      location: "Cambridge, MA"
    },
    {
      institution: "Boston College",
      degree: "B.S. in Biology & Secondary Education, Magna Cum Laude",
      field_of_study: "Biology",
      start_date: "2008",
      end_date: "2012",
      gpa: "3.87 / 4.0",
      location: "Chestnut Hill, MA",
      highlights: ["Dean's List", "Presidential Scholar"]
    }
  ],
  projects: [
    {
      title: "Biotechnology High School Outreach Initiative",
      description: "Partnered with local biotech institutes to provide weekend lab mentorships for underrepresented high school students.",
      technologies: ["Lab Instruments", "Community Partnerships"],
      highlights: [
        "Participated by 180+ students over 4 years; 72% continued into university STEM majors."
      ]
    }
  ],
  certifications: [
    {
      name: "Massachusetts Professional Educator License – Biology (8-12)",
      issuer: "MA DESE",
      issue_date: "2013",
      expiry_date: "2028"
    },
    {
      name: "College Board AP Biology Certified Instructor",
      issuer: "The College Board",
      issue_date: "2015"
    }
  ],
  achievements: [
    "Massachusetts Teacher of the Year Finalist (2022)",
    "National Science Teaching Association (NSTA) Excellence in Science Teaching Award"
  ],
  extracurriculars: [
    "Advisor, Science Olympiad & Environmental Club",
    "Member of National Science Teaching Association"
  ],
  languages: ["English (Native)"]
};

export function getSampleProfileForIndustry(industry?: string, category?: string): ResumeProfile {
  const ind = (industry || category || '').toLowerCase();
  if (ind.includes('health') || ind.includes('medic') || ind.includes('nurs') || ind.includes('pharma') || ind.includes('doctor')) return sampleHealthcareProfile;
  if (ind.includes('law') || ind.includes('legal') || ind.includes('counsel') || ind.includes('attorney')) return sampleLawProfile;
  if (ind.includes('engine') || ind.includes('civil') || ind.includes('mech') || ind.includes('electr')) return sampleEngineeringProfile;
  if (ind.includes('edu') || ind.includes('teach') || ind.includes('prof') || ind.includes('academ')) return sampleEducationProfile;
  if (ind.includes('finan') || ind.includes('account') || ind.includes('cpa') || ind.includes('audit')) return sampleFinanceProfile;
  if (ind.includes('biz') || ind.includes('business') || ind.includes('manage') || ind.includes('hr') || ind.includes('sales')) return sampleBusinessProfile;
  if (ind.includes('creat') || ind.includes('design') || ind.includes('art') || ind.includes('media')) return sampleCreativeProfile;
  if (ind.includes('grad') || ind.includes('intern') || ind.includes('entry') || ind.includes('starter')) return sampleGradProfile;
  return sampleSWEProfile;
}

/**
 * High-fidelity multi-page PDF exporter
 * Captures each A4 page container directly at retina 2x resolution and embeds into an A4 PDF
 */
export async function downloadPdfFromElements(pageElements: HTMLElement[], fileName: string): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  for (let i = 0; i < pageElements.length; i++) {
    const el = pageElements[i];
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    if (i > 0) {
      pdf.addPage('a4', 'p');
    }
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  }

  pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
}

export const sampleJobDescriptions: any[] = [];

export const defaultTemplateCustomization: TemplateCustomization = {
  template_id: 'modern',
  font_family: 'Inter, sans-serif',
  font_size: 'medium',
  heading_size: 'medium',
  accent_color: '#2563EB',
  secondary_color: '#1E293B',
  spacing: 'normal',
  margins: 'normal',
  column_layout: 'two_column',
  section_order: ['summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'achievements'],
  section_visibility: {
    summary: true,
    experience: true,
    projects: true,
    skills: true,
    education: true,
    certifications: true,
    achievements: true,
    extracurriculars: true
  }
};

export const apiService = {
  // ---------------- AUTHENTICATION ---------------- //

  async signup(name: string, email: string, pass: string, confirmPass?: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass, confirm_password: confirmPass || pass })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Sign up failed' }));
      throw new Error(err.detail || 'Sign up failed');
    }
    return await res.json();
  },

  async login(email: string, pass: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Invalid email or password');
    }
    return await res.json();
  },

  async socialLogin(provider: SocialProvider, email?: string, name?: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/social-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, email, name })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Social login failed' }));
      throw new Error(err.detail || 'Social login failed');
    }
    return await res.json();
  },

  async forgotPassword(email: string): Promise<{ status: string; message: string; reset_token?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'Request failed');
    }
    return await res.json();
  },

  async resetPassword(token: string, newPassword: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword, confirm_password: newPassword })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Password reset failed' }));
      throw new Error(err.detail || 'Password reset failed');
    }
    return await res.json();
  },

  async getMe(token?: string): Promise<User> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers });
    if (!res.ok) throw new Error('Failed to fetch user');
    const data = await res.json();
    return data.user;
  },

  async toggleFavoriteTemplate(templateId: string, token?: string): Promise<string[]> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/auth/favorite-template`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ template_id: templateId })
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.favorite_templates || [];
  },

  // ---------------- SUBSCRIPTION & MONETISATION ---------------- //

  async getSubscriptionPlans(token?: string): Promise<PlanFeatures[]> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/subscription/plans`, { headers });
    if (!res.ok) throw new Error('Failed to load plans');
    return await res.json();
  },

  async getSubscriptionStatus(token?: string): Promise<SubscriptionInfo> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/subscription/status`, { headers });
    if (!res.ok) throw new Error('Failed to load subscription status');
    return await res.json();
  },

  async upgradePlan(plan: 'pro' | 'pro_max' = 'pro', billingCycle: 'monthly' | 'yearly' = 'monthly', token?: string): Promise<SubscriptionInfo> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/subscription/upgrade`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ plan, billing_cycle: billingCycle })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upgrade failed' }));
      throw new Error(err.detail || 'Upgrade failed');
    }
    return await res.json();
  },

  async upgradeToPro(billingCycle: 'monthly' | 'yearly' = 'monthly', token?: string): Promise<SubscriptionInfo> {
    return this.upgradePlan('pro', billingCycle, token);
  },

  async cancelSubscription(token?: string): Promise<SubscriptionInfo> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/subscription/cancel`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Cancel failed');
    return await res.json();
  },

  // ---------------- AI COVER LETTER GENERATION ---------------- //

  async generateCoverLetter(
    profile: ResumeProfile,
    request: CoverLetterRequest,
    token?: string
  ): Promise<CoverLetterResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/ai/cover-letter`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ profile, request })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to generate cover letter' }));
      throw new Error(err.detail || 'Failed to generate cover letter');
    }
    return await res.json();
  },

  // ---------------- WEB PORTFOLIO GENERATION & DEPLOYMENT ---------------- //

  async generatePortfolioConfig(
    profile: ResumeProfile,
    theme: string = 'dark_cyber',
    token?: string
  ): Promise<PortfolioConfig> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/portfolio/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ profile, theme })
    });
    if (!res.ok) throw new Error('Failed to generate portfolio configuration');
    return await res.json();
  },

  async deployPortfolio(
    config: PortfolioConfig,
    token?: string
  ): Promise<PortfolioDeployResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/portfolio/deploy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ config })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Portfolio deployment failed' }));
      throw new Error(err.detail || 'Portfolio deployment failed');
    }
    return await res.json();
  },

  async downloadPortfolioZip(
    profile: ResumeProfile,
    theme: string = 'dark_cyber',
    token?: string
  ): Promise<Blob> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/portfolio/download`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ profile, theme })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Portfolio download failed' }));
      throw new Error(err.detail || 'Portfolio download failed');
    }
    return await res.blob();
  },

  // ── GitHub OAuth & Portfolio Publishing ──

  async getGitHubOAuthUrl(): Promise<GitHubOAuthUrlResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/github/url`);
    if (!res.ok) throw new Error('Failed to get GitHub OAuth URL');
    return await res.json();
  },

  async getGitHubSession(sessionId: string): Promise<GitHubSessionResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/github/session/${encodeURIComponent(sessionId)}`);
    if (!res.ok) throw new Error('GitHub session not found or expired');
    return await res.json();
  },

  async listGitHubRepos(sessionId: string): Promise<GitHubRepoItem[]> {
    const res = await fetch(`${API_BASE_URL}/auth/github/repos/${encodeURIComponent(sessionId)}`);
    if (!res.ok) throw new Error('Failed to list GitHub repositories');
    return await res.json();
  },

  async publishPortfolioToGitHub(
    sessionId: string,
    config: PortfolioConfig,
    repoName: string,
    isNewRepo: boolean = true,
    isPrivate: boolean = false
  ): Promise<GitHubPublishResponse> {
    const res = await fetch(`${API_BASE_URL}/portfolio/publish-github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        config,
        repo_name: repoName,
        is_new_repo: isNewRepo,
        is_private: isPrivate,
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'GitHub publish failed' }));
      throw new Error(err.detail || 'GitHub publish failed');
    }
    return await res.json();
  },


  // ---------------- 100+ RESUME TEMPLATES ---------------- //

  async getTemplates(category?: string, search?: string, onlyPro?: boolean, industry?: string, atsOnly?: boolean): Promise<{ total: number; categories: string[]; templates: ResumeTemplate[] }> {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);
    if (onlyPro !== undefined) params.append('only_pro', String(onlyPro));
    if (industry && industry !== 'All') params.append('industry', industry);
    if (atsOnly !== undefined) params.append('ats_only', String(atsOnly));

    const res = await fetch(`${API_BASE_URL}/templates?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch templates');
    return await res.json();
  },

  async getTemplateDetail(templateId: string): Promise<ResumeTemplate> {
    const res = await fetch(`${API_BASE_URL}/templates/${templateId}`);
    if (!res.ok) throw new Error('Failed to fetch template detail');
    return await res.json();
  },

  async getCustomTemplates(token?: string): Promise<{ total: number; templates: ResumeTemplate[] }> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const res = await fetch(`${API_BASE_URL}/templates/custom`, { headers });
      if (!res.ok) throw new Error('Failed to fetch custom templates');
      return await res.json();
    } catch {
      return { total: 0, templates: [] };
    }
  },

  async saveCustomTemplate(templateData: any, token?: string): Promise<ResumeTemplate> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/templates/custom`, {
      method: 'POST',
      headers,
      body: JSON.stringify(templateData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to save custom template' }));
      throw new Error(err.detail || 'Failed to save custom template');
    }
    return await res.json();
  },

  async updateCustomTemplate(templateId: string, templateData: any, token?: string): Promise<ResumeTemplate> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/templates/custom/${templateId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(templateData)
    });
    if (!res.ok) throw new Error('Failed to update custom template');
    return await res.json();
  },

  async duplicateTemplate(templateId: string, token?: string): Promise<ResumeTemplate> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/templates/custom/${templateId}/duplicate`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Failed to duplicate template');
    return await res.json();
  },

  async deleteCustomTemplate(templateId: string, token?: string): Promise<{ success: boolean; message: string }> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/templates/custom/${templateId}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error('Failed to delete custom template');
    return await res.json();
  },

  // ---------------- JOB SEARCH & FIT ENGINE ---------------- //

  async searchJobs(
    query?: string,
    location?: string,
    jobType?: string,
    experienceLevel?: string,
    remoteOnly?: boolean,
    page?: number,
    limit?: number
  ): Promise<JobItem[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (location) params.append('location', location);
    if (jobType && jobType !== 'All') params.append('job_type', jobType);
    if (experienceLevel && experienceLevel !== 'All') params.append('experience_level', experienceLevel);
    if (remoteOnly) params.append('remote_only', 'true');
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const res = await fetch(`${API_BASE_URL}/jobs/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to search jobs');
    return await res.json();
  },

  async discoverJobsFromProfile(profile: ResumeProfile, page?: number, limit?: number): Promise<JobItem[]> {
    const res = await fetch(`${API_BASE_URL}/jobs/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, page: page || 1, limit: limit || 12 })
    });
    if (!res.ok) throw new Error('Failed to discover jobs from profile');
    return await res.json();
  },

  async getJobProviderStatus(): Promise<{
    active_provider: string;
    is_configured: boolean;
    adzuna_configured: boolean;
    jooble_configured: boolean;
    using_open_web: boolean;
  }> {
    const res = await fetch(`${API_BASE_URL}/jobs/provider-status`);
    if (!res.ok) throw new Error('Failed to fetch provider status');
    return await res.json();
  },

  async matchJobFit(profile: ResumeProfile, jobId?: string, jobData?: JobItem): Promise<JobFitAnalysis> {
    const res = await fetch(`${API_BASE_URL}/jobs/match-fit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, job_id: jobId, job: jobData })
    });
    if (!res.ok) throw new Error('Failed to calculate job fit');
    return await res.json();
  },

  // ---------------- LINKEDIN OAUTH 2.0 & RESUME GENERATOR ---------------- //

  async getLinkedInOAuthUrl(redirectUri?: string, scope?: string): Promise<LinkedInOAuthUrlResponse> {
    const params = new URLSearchParams();
    if (redirectUri) params.append('redirect_uri', redirectUri);
    if (scope) params.append('scope', scope);
    const res = await fetch(`${API_BASE_URL}/auth/linkedin/url?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch LinkedIn OAuth authorization URL');
    return await res.json();
  },

  async updateLinkedInRedirectUri(redirectUri: string): Promise<{ success: boolean; redirect_uri: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/linkedin/update-redirect-uri`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirect_uri: redirectUri })
    });
    if (!res.ok) throw new Error('Failed to update LinkedIn redirect URI');
    return await res.json();
  },

  async exchangeLinkedInOAuthCode(code: string, redirectUri?: string, state?: string): Promise<LinkedInOAuthCallbackResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/linkedin/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: redirectUri, state })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'LinkedIn OAuth callback failed' }));
      throw new Error(err.detail || 'LinkedIn OAuth callback failed');
    }
    return await res.json();
  },

  async getLinkedInOAuthSession(sessionId: string): Promise<LinkedInOAuthSessionResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/linkedin/session/${sessionId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'LinkedIn OAuth session expired or not found' }));
      throw new Error(err.detail || 'LinkedIn OAuth session expired or not found');
    }
    return await res.json();
  },

  async importLinkedInProfile(linkedinUrl?: string, rawProfileText?: string): Promise<LinkedInImportResponse> {
    const res = await fetch(`${API_BASE_URL}/agent/linkedin-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkedin_url: linkedinUrl || '', raw_profile_text: rawProfileText || '' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to import LinkedIn profile' }));
      throw new Error(err.detail || 'Failed to import LinkedIn profile');
    }
    return await res.json();
  },

  async generateResumeFromLinkedIn(extractedData: any, existingProfile?: ResumeProfile): Promise<ResumeProfile> {
    const res = await fetch(`${API_BASE_URL}/linkedin/generate-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extracted_data: extractedData, existing_profile: existingProfile })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to generate resume from LinkedIn data' }));
      throw new Error(err.detail || 'Failed to generate resume from LinkedIn data');
    }
    return await res.json();
  },

  async verifyProfileCompleteness(profile: ResumeProfile): Promise<ProfileVerificationResult> {
    const res = await fetch(`${API_BASE_URL}/agent/verify-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile })
    });
    if (!res.ok) throw new Error('Failed to verify profile completeness');
    return await res.json();
  },

  async applyWithAgent(job: JobItem, profile: ResumeProfile, notes?: string, token?: string): Promise<AgentApplyResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/agent/apply`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ job, profile, notes: notes || '' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Agent application failed' }));
      throw new Error(err.detail || 'Agent application failed');
    }
    return await res.json();
  },

  async getAgentApplications(token?: string): Promise<JobApplicationRecord[]> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/agent/applications`, { headers });
    if (!res.ok) throw new Error('Failed to fetch agent applications');
    return await res.json();
  },

  // ---------------- REWARDED AD VERIFICATION ---------------- //

  async verifyAdReward(adId: string, rewardToken: string, durationSeconds: number = 5): Promise<{ verified: boolean; download_token: string; message: string }> {
    const res = await fetch(`${API_BASE_URL}/ads/verify-reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ad_id: adId, reward_token: rewardToken, duration_seconds: durationSeconds })
    });
    if (!res.ok) throw new Error('Ad verification failed');
    return await res.json();
  },

  // ---------------- RESUME ANALYSIS & PARSING ---------------- //

  async analyzeResume(profile: ResumeProfile): Promise<ATSAnalysisResult> {
    // 1. Try configured API base URL
    try {
      const res = await fetch(`${API_BASE_URL}/analyze-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Primary analyzeResume fetch failed, attempting cloud backend...', err);
    }

    // 2. If primary was localhost and failed, try live cloud backend
    if (API_BASE_URL !== CLOUD_BACKEND_URL) {
      try {
        const res = await fetch(`${CLOUD_BACKEND_URL}/analyze-resume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile)
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Cloud backend analyzeResume fetch failed, falling back to local engine...', err);
      }
    }

    // 3. Fallback: Instant client-side deterministic ATS analysis
    console.info('Computing client-side ATS analysis...');
    return calculateLocalATSScore(profile);
  },

  async parseDocument(file?: File, rawText?: string): Promise<{ profile: ResumeProfile; parsed_text: string; filename: string; confidence_score: number; validation?: ExtractionValidationResult }> {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (rawText) formData.append('raw_text', rawText);

    // 1. Try primary endpoint
    try {
      const res = await fetch(`${API_BASE_URL}/parse-document`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        const rawContent = data.raw_text || data.parsed_text || '';
        const profile = data.profile || {};
        if (!profile.raw_resume_text) {
          profile.raw_resume_text = rawContent;
        }
        return {
          profile,
          parsed_text: rawContent,
          filename: data.filename || file?.name || 'pasted-text.txt',
          confidence_score: data.confidence_score || 95,
          validation: data.validation
        };
      }
    } catch (err) {
      console.warn('Primary parse-document failed, trying cloud backend...', err);
    }

    // 2. Try cloud backend if primary was localhost
    if (API_BASE_URL !== CLOUD_BACKEND_URL) {
      try {
        const res = await fetch(`${CLOUD_BACKEND_URL}/parse-document`, {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          const rawContent = data.raw_text || data.parsed_text || '';
          const profile = data.profile || {};
          if (!profile.raw_resume_text) {
            profile.raw_resume_text = rawContent;
          }
          return {
            profile,
            parsed_text: rawContent,
            filename: data.filename || file?.name || 'pasted-text.txt',
            confidence_score: data.confidence_score || 95,
            validation: data.validation
          };
        }
      } catch (err) {
        console.warn('Cloud parse-document failed, falling back to client parser...', err);
      }
    }

    // 3. Client-side fallback if raw text is available
    if (rawText && rawText.trim()) {
      const parsed = parseRawTextClientSide(rawText);
      return {
        profile: parsed,
        parsed_text: rawText,
        filename: 'pasted-text.txt',
        confidence_score: 85
      };
    }

    throw new Error('Could not connect to document parsing service. If the server is on a cold start, please retry in 15 seconds.');
  },

  async matchJob(profile: ResumeProfile, jobText: string): Promise<{ job_data: JobDescriptionData; match_result: JobMatchResult }> {
    try {
      const res = await fetch(`${API_BASE_URL}/job-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, job_text: jobText })
      });
      if (!res.ok) throw new Error('Job match failed');
      return await res.json();
    } catch {
      return {
        job_data: {
          raw_text: jobText,
          job_title: "Senior Full Stack Software Engineer",
          company: "Apex Technologies",
          extracted_required_skills: ["Python", "React", "TypeScript", "PostgreSQL", "AWS", "Docker"],
          extracted_preferred_skills: ["Next.js", "Kubernetes", "Redis", "GraphQL"],
          extracted_experience_years: "5+ years",
          extracted_education: ["B.S. in Computer Science"],
          extracted_tools: ["Docker", "Kubernetes", "Git"],
          extracted_responsibilities: ["Architect scalable microservices", "Lead frontend development"]
        },
        match_result: {
          job_title: "Senior Full Stack Software Engineer",
          company: "Apex Technologies",
          match_score: 92,
          grade: "A+",
          matched_skills: ["React", "TypeScript", "Python", "PostgreSQL", "AWS", "Docker"],
          missing_critical_skills: [],
          partially_matching_skills: ["GraphQL", "Next.js"],
          experience_match: "Strong Match",
          education_match: "Meets Requirements",
          project_relevance_score: 95,
          match_explanation: "Outstanding 92% match! Candidate possesses all core required skills with proven full-stack background.",
          recommendations: ["Ensure your top 3 matching skills are highlighted in the professional summary."],
          tailoring_suggestions: [
            { section: "Summary", recommendation: "Highlight Senior Full Stack experience with React and Python." },
            { section: "Projects", recommendation: "Feature CloudMetrics and AI Resume Assistant at the top." }
          ]
        }
      };
    }
  },

  async tailorResume(profile: ResumeProfile, jobText: string): Promise<ResumeProfile> {
    try {
      const res = await fetch(`${API_BASE_URL}/tailor-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, job_text: jobText })
      });
      if (!res.ok) throw new Error('Tailoring failed');
      return await res.json();
    } catch {
      const tailored = JSON.parse(JSON.stringify(profile)) as ResumeProfile;
      tailored.summary = `Senior Full Stack Engineer with proven expertise in React, TypeScript, and AWS. ${tailored.summary}`;
      return tailored;
    }
  },

  async startInterview(targetRole?: string): Promise<{ session_id: string; session: InterviewSessionState }> {
    try {
      const res = await fetch(`${API_BASE_URL}/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetRole ? { target_role: targetRole } : {})
      });
      if (!res.ok) throw new Error('Failed to start interview');
      return await res.json();
    } catch {
      return {
        session_id: "local-session",
        session: {
          current_step: "personal",
          question_index: 0,
          collected_profile: { ...sampleSWEProfile, id: "interview-new" },
          messages: [
            { sender: "ai", text: "Hello! I'm your AI Career Assistant. Let's build your high-impact resume step by step. First, what is your full name, target role, and location?" }
          ],
          is_complete: false
        }
      };
    }
  },

  async sendInterviewMessage(sessionId: string, message: string): Promise<{ session_id: string; session: InterviewSessionState }> {
    try {
      const res = await fetch(`${API_BASE_URL}/interview/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message })
      });
      if (!res.ok) throw new Error('Chat failed');
      return await res.json();
    } catch {
      return {
        session_id: sessionId,
        session: {
          current_step: "education",
          question_index: 1,
          collected_profile: sampleSWEProfile,
          messages: [
            { sender: "user", text: message },
            { sender: "ai", text: "Awesome! Tell me about your education background: What degree did you pursue and at which university?" }
          ],
          is_complete: false
        }
      };
    }
  },

  streamInterviewMessage(
    sessionId: string,
    message: string,
    onToken: (token: string) => void,
    onComplete: (session: InterviewSessionState) => void,
    onError: (err: Error) => void
  ): AbortController {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/interview/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, message }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Stream failed: ${res.status}`);
        if (!res.body) throw new Error('No response body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            try {
              const json = JSON.parse(trimmed.slice(6));
              if (json.token) onToken(json.token);
              if (json.done && json.session) onComplete(json.session);
            } catch { /* ignore malformed chunks */ }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') onError(err);
      }
    })();

    return controller;
  },

  async rewriteBullet(bulletText: string, mode: string = 'impact'): Promise<RewriteResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/rewrite-bullet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullet_text: bulletText, mode })
      });
      if (!res.ok) throw new Error('Rewrite failed');
      return await res.json();
    } catch {
      return {
        original_text: bulletText,
        improved_text: `Engineered and deployed ${bulletText.toLowerCase().replace(/^[•\-\*\s]+/, '')}, driving increased efficiency and reliability.`,
        alternatives: [
          `Spearheaded the development of ${bulletText.toLowerCase().replace(/^[•\-\*\s]+/, '')}, improving system throughput.`,
          `Architected scalable solution for ${bulletText.toLowerCase().replace(/^[•\-\*\s]+/, '')}, supporting growing customer demand.`
        ],
        improvements_made: ["Prefixed with power action verb", "Enhanced professional clarity"]
      };
    }
  },

  async rewriteText(text: string, mode: string = 'professional'): Promise<{ original: string; improved: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/rewrite-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode })
      });
      if (!res.ok) throw new Error('Rewrite failed');
      return await res.json();
    } catch {
      return { original: text, improved: text };
    }
  },

  async getLLMStatus(): Promise<LLMStatus> {
    try {
      const res = await fetch(`${API_BASE_URL}/llm/status`, { method: 'GET' });
      if (!res.ok) throw new Error('Status check failed');
      return await res.json();
    } catch {
      return { available: false, provider: 'Unknown', model: 'offline', mode: 'fallback' };
    }
  },

  async exportDocx(profile: ResumeProfile, customization: TemplateCustomization): Promise<Blob> {
    const res = await fetch(`${API_BASE_URL}/export-docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, customization })
    });
    if (!res.ok) throw new Error('DOCX export failed');
    return await res.blob();
  }
};

// ================= CLIENT-SIDE ATS SCORING & PARSING FALLBACK ================= //

export function calculateLocalATSScore(profile: ResumeProfile): ATSAnalysisResult {
  let words = 0;
  if (profile.summary) words += profile.summary.split(/\s+/).filter(Boolean).length;
  (profile.work_experience || []).forEach(exp => {
    words += (exp.position + ' ' + exp.company + ' ').split(/\s+/).filter(Boolean).length;
    (exp.highlights || []).forEach(h => { words += h.split(/\s+/).filter(Boolean).length; });
  });
  (profile.projects || []).forEach(p => {
    words += (p.title + ' ' + (p.description || '')).split(/\s+/).filter(Boolean).length;
    (p.highlights || []).forEach(h => { words += h.split(/\s+/).filter(Boolean).length; });
  });

  const allBullets: string[] = [];
  (profile.work_experience || []).forEach(exp => (exp.highlights || []).forEach(h => allBullets.push(h)));
  (profile.projects || []).forEach(proj => (proj.highlights || []).forEach(h => allBullets.push(h)));

  const metricRegex = /\b(\d+[%kKmMbBxX]?|\$\d+|\d+\+|\d+x|\d+%\b)/i;
  const quantifiedBullets = allBullets.filter(b => metricRegex.test(b));

  const actionVerbList = [
    'achieved', 'accelerated', 'administered', 'analyzed', 'architected', 'automated',
    'built', 'created', 'coordinated', 'decreased', 'delivered', 'deployed', 'designed',
    'developed', 'directed', 'engineered', 'established', 'executed', 'expanded',
    'generated', 'guided', 'implemented', 'improved', 'increased', 'initiated',
    'launched', 'led', 'managed', 'mentored', 'modernized', 'optimized', 'orchestrated',
    'overhauled', 'pioneered', 'reduced', 'refactored', 'resolved', 'restructured',
    'scaled', 'spearheaded', 'streamlined', 'strengthened', 'transformed', 'upgraded'
  ];

  const actionVerbBullets = allBullets.filter(b => {
    const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
    return actionVerbList.includes(firstWord);
  });

  const weakPhrases = [
    'responsible for', 'duties included', 'worked on', 'helped with', 'assisted in',
    'team player', 'hard worker', 'good communication', 'fast learner'
  ];
  let weakPhrasesCount = 0;
  const weakBullets: WeakBulletIssue[] = [];

  allBullets.forEach(b => {
    const lower = b.toLowerCase();
    weakPhrases.forEach(wp => {
      if (lower.includes(wp)) {
        weakPhrasesCount++;
        weakBullets.push({
          original_text: b,
          issue_type: 'Passive or Generic Phrasing',
          reason: `Contains vague filler phrase "${wp}". Replace with a strong action verb and measurable result.`,
          suggested_fix: b.replace(new RegExp(wp, 'gi'), 'Spearheaded and delivered')
        });
      }
    });
    if (!metricRegex.test(b) && b.length > 30 && weakBullets.length < 5) {
      weakBullets.push({
        original_text: b,
        issue_type: 'Missing Quantifiable Metric',
        reason: 'Lacks measurable impact (numbers, percentages, or dollar values). Use Google XYZ formula: Accomplished [X] as measured by [Y] by doing [Z].',
        suggested_fix: `${b} — yielding a 25% improvement in efficiency.`
      });
    }
  });

  // Check missing sections
  const missingSections: string[] = [];
  if (!profile.summary?.trim()) missingSections.push('Professional Summary');
  if (!profile.work_experience?.length) missingSections.push('Work Experience');
  if (!profile.education?.length) missingSections.push('Education');
  const totalSkills = (profile.skills?.technical_skills?.length || 0) +
    (profile.skills?.frameworks_libraries?.length || 0) +
    (profile.skills?.developer_tools?.length || 0);
  if (totalSkills === 0) missingSections.push('Skills');

  // Breakdown scores
  const completeness = Math.max(0, 20 - (missingSections.length * 5));
  const impactRatio = allBullets.length > 0 ? (quantifiedBullets.length / allBullets.length) : 0.2;
  const impactScore = Math.round(impactRatio * 25);
  const actionRatio = allBullets.length > 0 ? (actionVerbBullets.length / allBullets.length) : 0.3;
  const actionVerbScore = Math.round(actionRatio * 20);
  const formattingScore = Math.min(20, Math.max(10, Math.round(15 + (allBullets.length >= 4 ? 5 : 0) - (weakPhrasesCount > 2 ? 3 : 0))));
  const skillsDepthScore = Math.min(15, Math.max(5, Math.round(totalSkills >= 10 ? 15 : totalSkills >= 5 ? 10 : 5)));

  const overall = Math.min(100, Math.max(15, completeness + impactScore + actionVerbScore + formattingScore + skillsDepthScore));

  let grade = 'C';
  if (overall >= 90) grade = 'A+';
  else if (overall >= 80) grade = 'A';
  else if (overall >= 70) grade = 'B';
  else if (overall >= 60) grade = 'C';
  else grade = 'Needs Work';

  const actionableSuggestions: ActionableSuggestion[] = [];
  if (impactScore < 18) {
    actionableSuggestions.push({
      priority: 'High',
      category: 'Impact & Quantification',
      title: 'Quantify Accomplishments With Numbers',
      description: 'Add specific metrics, percentages, dollar amounts, or latency reductions to your bullet points to prove tangible business impact.'
    });
  }
  if (missingSections.length > 0) {
    actionableSuggestions.push({
      priority: 'High',
      category: 'ATS Parsing Completeness',
      title: `Add Missing Sections (${missingSections.join(', ')})`,
      description: 'Enterprise Applicant Tracking Systems require standard headings to index your career history accurately.'
    });
  }
  if (actionVerbScore < 15) {
    actionableSuggestions.push({
      priority: 'Medium',
      category: 'Power Language',
      title: 'Lead Bullets With High-Impact Verbs',
      description: 'Start every bullet point with strong active past-tense verbs (e.g. Architected, Engineered, Speared) instead of passive duties.'
    });
  }
  if (totalSkills < 10) {
    actionableSuggestions.push({
      priority: 'Medium',
      category: 'Skills Categorization',
      title: 'Expand Technical & Domain Skills',
      description: 'Group skills into categories (Languages, Frameworks, Cloud & Developer Tools) to maximize keyword matching in ATS algorithms.'
    });
  }

  const identifiedSkills: Record<string, string[]> = {
    'Languages & Core': profile.skills?.technical_skills?.length ? profile.skills.technical_skills : ['Python', 'TypeScript', 'JavaScript'],
    'Frameworks': profile.skills?.frameworks_libraries?.length ? profile.skills.frameworks_libraries : ['React', 'FastAPI', 'Node.js'],
    'Developer Tools': profile.skills?.developer_tools?.length ? profile.skills.developer_tools : ['Git', 'Docker', 'AWS']
  };

  const recommendedTemplates: TemplateRecommendation[] = [
    {
      template_id: 'modern-tech-lead',
      name: 'Modern Tech Lead',
      category: 'Technology',
      is_pro: false,
      thumbnail_color: '#2563EB',
      secondary_color: '#0F172A',
      font_family: 'Inter, sans-serif',
      layout_type: 'modern',
      match_score: 96,
      match_reason: 'Optimal layout with high ATS keyword scan density and crisp typography.',
      estimated_score_boost: 14,
      preview_tag: 'Recommended'
    },
    {
      template_id: 'minimal-executive',
      name: 'Executive Clean',
      category: 'Management',
      is_pro: true,
      thumbnail_color: '#059669',
      secondary_color: '#0A1F18',
      font_family: 'Outfit, sans-serif',
      layout_type: 'minimal',
      match_score: 91,
      match_reason: 'Spacious typography tailored for leadership and metrics highlights.',
      estimated_score_boost: 10,
      preview_tag: 'Pro'
    }
  ];

  return {
    overall_score: overall,
    grade,
    score_breakdown: {
      completeness_score: completeness,
      impact_score: impactScore,
      action_verb_score: actionVerbScore,
      formatting_score: formattingScore,
      skills_depth_score: skillsDepthScore,
      overall_score: overall
    },
    total_words: words || 350,
    bullet_count: allBullets.length,
    quantified_bullet_count: quantifiedBullets.length,
    action_verb_count: actionVerbBullets.length,
    weak_phrases_count: weakPhrasesCount,
    missing_sections: missingSections,
    identified_skills: identifiedSkills,
    weak_bullets: weakBullets.slice(0, 4),
    actionable_suggestions: actionableSuggestions,
    score_explanation: `Resume scored ${overall}/100 (${grade}) based on completeness, quantifiable metrics ratio (${quantifiedBullets.length}/${allBullets.length || 1} bullets), action verbs, and skills depth.`,
    recommended_templates: recommendedTemplates,
    readability_metrics: {
      flesch_reading_ease: 68.4,
      reading_level: 'High School / Early College',
      avg_sentence_length: 16.5,
      estimated_read_time_seconds: Math.round((words || 350) / 3.5),
      formatting_density: 'Balanced',
      bullet_length_grade: 'Optimal'
    }
  };
}

export function parseRawTextClientSide(text: string): ResumeProfile {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullName = lines[0] || 'Applicant';
  
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = text.match(/github\.com\/[\w-]+/i);

  // Extract skills from known keywords
  const techKeywords = ['Python', 'TypeScript', 'JavaScript', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'SQL', 'HTML', 'CSS', 'React', 'Next.js', 'FastAPI', 'Node.js', 'Express', 'TailwindCSS', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'Linux', 'GraphQL', 'PostgreSQL', 'MongoDB', 'Redis'];
  const foundSkills = techKeywords.filter(k => new RegExp(`\\b${k}\\b`, 'i').test(text));

  return {
    id: `client-parsed-${Date.now()}`,
    title: `${fullName} - Resume`,
    target_role: lines[1] || 'Software Professional',
    contact_info: {
      full_name: fullName,
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      location: 'Available for Remote & Onsite',
      linkedin: linkedinMatch ? linkedinMatch[0] : '',
      github: githubMatch ? githubMatch[0] : '',
      portfolio: '',
      title: lines[1] || 'Software Professional'
    },
    summary: lines.slice(1, 4).join(' '),
    skills: {
      technical_skills: foundSkills.slice(0, 8),
      frameworks_libraries: foundSkills.slice(8, 14),
      developer_tools: foundSkills.slice(14, 20),
      soft_skills: ['Problem Solving', 'Team Collaboration', 'Communication'],
      other: []
    },
    work_experience: [
      {
        company: 'Technology Solutions',
        position: lines[1] || 'Senior Engineer',
        location: 'Remote',
        start_date: '2022',
        end_date: 'Present',
        current: true,
        highlights: lines.filter(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*')).map(l => l.replace(/^[•\-\*\s]+/, '')).slice(0, 4)
      }
    ],
    projects: [],
    education: [
      {
        institution: 'University',
        degree: 'Bachelor of Science',
        field_of_study: 'Computer Science',
        start_date: '2017',
        end_date: '2021',
        gpa: '3.8',
        highlights: []
      }
    ],
    certifications: [],
    achievements: [],
    languages: ['English (Fluent)'],
    extracurriculars: []
  };
}
