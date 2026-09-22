export type PlanType = 'free' | 'pro' | 'pro_max';
export type SocialProvider = 'google' | 'github';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: PlanType;
  provider: 'local' | 'google' | 'github';
  avatar_url?: string;
  created_at?: string;
  resumes_count?: number;
  ai_rewrites_used?: number;
  favorite_templates?: string[];
}

export interface PlanFeatures {
  plan: PlanType;
  name: string;
  description?: string;
  badge?: string | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_current?: boolean;
}

export interface SubscriptionInfo {
  plan: PlanType;
  status: 'active' | 'cancelled' | 'trialing' | 'past_due';
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
  payment_method?: string | null;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  is_pro: boolean;
  thumbnail_color: string;
  secondary_color: string;
  font_family: string;
  layout_type: string;
  spacing: string;
  tags: string[];
  rating: number;
  downloads_count: number;
  recommended_for?: string[];
}

export interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary_range: string;
  experience_level: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  posted_date: string;
  logo_emoji: string;
  remote_status?: string;
  source?: string;
  application_link?: string;
  application_status?: 'Found' | 'Ready to Apply' | 'Applied' | 'Failed';
  applied_at?: string;
  resume_used_id?: string;
  notes?: string;
}

export interface JobApplicationRecord {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  location: string;
  application_link: string;
  applied_at: string;
  resume_used: string;
  status: 'Found' | 'Ready to Apply' | 'Applied' | 'Failed';
  notes?: string;
}

export interface ProfileVerificationResult {
  is_complete: boolean;
  completion_percentage: number;
  missing_fields: string[];
  present_fields: string[];
  truthfulness_guidance: string;
}

export interface LinkedInImportResponse {
  success: boolean;
  message: string;
  linkedin_url: string;
  extracted_data: {
    full_name?: string;
    headline?: string;
    location?: string;
    email?: string;
    phone?: string;
    summary?: string;
    skills?: string[];
    work_experience?: ExperienceItem[];
    education?: EducationItem[];
    certifications?: CertificationItem[];
    projects?: ProjectItem[];
    publications?: { title: string; publisher?: string; date?: string; url?: string; description?: string }[];
    achievements?: string[];
    languages?: string[];
    profile_links?: Record<string, string>;
    unavailable_fields?: string[];
  };
  unavailable_fields?: string[];
}

export interface LinkedInResumeGenerateRequest {
  extracted_data: Record<string, any>;
  existing_profile?: ResumeProfile;
}

export interface LinkedInOAuthUrlResponse {
  configured: boolean;
  authorization_url: string;
  client_id: string;
  redirect_uri: string;
  state: string;
  scopes: string[];
  message: string;
}

export interface LinkedInOAuthCallbackResponse {
  success: boolean;
  message: string;
  user_info: Record<string, any>;
  candidate_profile: Record<string, any>;
  access_token?: string;
  generated_resume?: ResumeProfile;
}

export interface LinkedInOAuthSessionResponse {
  success: boolean;
  message?: string;
  user_info?: Record<string, any>;
  candidate_profile: Record<string, any>;
  generated_resume?: ResumeProfile;
}

export interface AgentApplyResponse {
  success: boolean;
  application_record: JobApplicationRecord;
  tailored_resume: ResumeProfile;
  message: string;
}

export interface JobFitAnalysis {
  job: JobItem;
  match_score: number;
  grade: string;
  matched_skills: string[];
  missing_skills: string[];
  partially_matching_skills: string[];
  experience_match: string;
  education_match: string;
  tailoring_suggestions: { section: string; recommendation: string }[];
}

export interface ContactInfo {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  title: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  gpa: string;
  location?: string;
  highlights: string[];
}

export interface ExperienceItem {
  company: string;
  position: string;
  location?: string;
  start_date: string;
  end_date: string;
  current: boolean;
  highlights: string[];
}

export interface ProjectItem {
  title: string;
  description: string;
  technologies: string[];
  link?: string;
  highlights: string[];
}

export interface CertificationItem {
  name: string;
  issuer?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface SkillsGroup {
  technical_skills: string[];
  frameworks_libraries: string[];
  developer_tools: string[];
  soft_skills: string[];
  languages?: string[];
  other: string[];
}

export interface ResumeProfile {
  id: string;
  title: string;
  target_role: string;
  contact_info: ContactInfo;
  summary: string;
  skills: SkillsGroup;
  work_experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  achievements: string[];
  extracurriculars: string[];
  languages?: string[];          // spoken languages e.g. ["English (Fluent)", "Urdu (Native)"]
  career_interests?: string;     // career goals / areas of interest
  raw_resume_text?: string;      // complete raw source of truth
}

export interface ExtractionValidationResult {
  is_valid: boolean;
  coverage_score: number;
  missing_sections: string[];
  dropped_items: string[];
  warnings: string[];
  stats: Record<string, number>;
}

export interface TemplateCustomization {
  template_id: string;
  font_family: string;
  font_size: 'small' | 'medium' | 'large';
  heading_size: 'small' | 'medium' | 'large';
  accent_color: string;
  secondary_color: string;
  spacing: 'compact' | 'normal' | 'spacious';
  margins: 'compact' | 'normal' | 'spacious';
  column_layout: 'single_column' | 'two_column';
  section_order: string[];
  section_visibility: Record<string, boolean>;
}

export interface LLMStatus {
  available: boolean;
  provider: string;
  model: string;
  mode: 'llm' | 'fallback';
  is_groq?: boolean;
  speed_tier?: string;
}

export interface ScoreBreakdown {
  completeness_score: number;
  impact_score: number;
  action_verb_score: number;
  formatting_score: number;
  skills_depth_score: number;
  overall_score: number;
}

export interface WeakBulletIssue {
  original_text: string;
  issue_type: string;
  reason: string;
  suggested_fix: string;
}

export interface ActionableSuggestion {
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  title: string;
  description: string;
}

export interface TemplateRecommendation {
  template_id: string;
  name: string;
  category: string;
  is_pro: boolean;
  thumbnail_color: string;
  secondary_color: string;
  font_family: string;
  layout_type: string;
  match_score: number;
  match_reason: string;
  estimated_score_boost: number;
  preview_tag: string;
}

export interface ReadabilityMetrics {
  flesch_reading_ease: number;
  reading_level: string;
  avg_sentence_length: number;
  estimated_read_time_seconds: number;
  formatting_density: string;
  bullet_length_grade: string;
}

export interface ATSAnalysisResult {
  overall_score: number;
  grade: string;
  score_breakdown: ScoreBreakdown;
  total_words: number;
  bullet_count: number;
  quantified_bullet_count: number;
  action_verb_count: number;
  weak_phrases_count: number;
  missing_sections: string[];
  identified_skills: Record<string, string[]>;
  weak_bullets: WeakBulletIssue[];
  actionable_suggestions: ActionableSuggestion[];
  score_explanation: string;
  recommended_templates?: TemplateRecommendation[];
  readability_metrics?: ReadabilityMetrics;
}

export interface CoverLetterRequest {
  job_title: string;
  company_name: string;
  job_description?: string;
  tone?: 'confident' | 'enthusiastic' | 'executive' | 'technical';
  custom_notes?: string;
}

export interface CoverLetterResponse {
  recipient_name: string;
  company_name: string;
  job_title: string;
  opening_paragraph: string;
  body_paragraphs: string[];
  closing_paragraph: string;
  full_text: string;
  matching_keywords_used: string[];
}

export interface PortfolioProject {
  title: string;
  description: string;
  technologies: string[];
  live_link?: string;
  github_link?: string;
  featured: boolean;
  image_url?: string;
}

export interface PortfolioConfig {
  subdomain: string;
  theme: string;
  hero_headline: string;
  hero_bio: string;
  skills_spotlight: string[];
  projects: PortfolioProject[];
  experience_timeline: {
    company: string;
    role: string;
    period: string;
    location: string;
    highlights: string[];
  }[];
  social_links: Record<string, string>;
  allow_pdf_download: boolean;
  contact_email_enabled: boolean;
  custom_accent_color: string;
}

export interface PortfolioDeployResponse {
  deployment_id: string;
  live_url: string;
  status: string;
  deployed_at: string;
  cdn_region: string;
  message: string;
}

export interface GitHubOAuthUrlResponse {
  configured: boolean;
  authorization_url: string;
  client_id: string;
  redirect_uri: string;
  state: string;
  scopes: string[];
  message: string;
}

export interface GitHubSessionResponse {
  session_id: string;
  username: string;
  name: string;
  avatar_url: string;
  email: string;
}

export interface GitHubRepoItem {
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
  updated_at: string;
}

export interface GitHubPublishResponse {
  repo_name: string;
  repo_full_name: string;
  html_url: string;
  pages_url: string;
  pushed_files: string[];
  message: string;
}

export const PORTFOLIO_THEMES = [
  { id: 'dark_cyber',         name: 'Dark Cyber Neon',      accent: '#3B82F6', desc: 'Electric blue glowing accents on obsidian dark background' },
  { id: 'emerald_clean',      name: 'Emerald Minimal',       accent: '#10B981', desc: 'Clean modern typography with forest & mint green highlights' },
  { id: 'obsidian_executive', name: 'Obsidian Executive',    accent: '#D97706', desc: 'Refined warm amber & gold details for senior engineering leads' },
  { id: 'minimal_luxe',       name: 'Minimal Luxe',          accent: '#E11D48', desc: 'Ultra-sleek crimson rose palette with expansive modern whitespace' },
  { id: 'light_professional', name: 'Light Professional',    accent: '#2563EB', desc: 'Clean white & blue — classic, recruiter-ready professional look' },
  { id: 'dev_code',           name: 'Dev Terminal',          accent: '#00FF41', desc: 'Dark GitHub-style with terminal green — built for developers' },
  { id: 'corporate_navy',     name: 'Corporate Navy',        accent: '#1E3A5F', desc: 'Professional light background with deep navy accents' },
  { id: 'warm_creative',      name: 'Warm Creative',         accent: '#EA580C', desc: 'Warm cream & orange — ideal for designers and creative professionals' },
] as const;


export interface JobDescriptionData {
  raw_text: string;
  job_title: string;
  company: string;
  extracted_required_skills: string[];
  extracted_preferred_skills: string[];
  extracted_experience_years?: string;
  extracted_education: string[];
  extracted_tools: string[];
  extracted_responsibilities: string[];
}

export interface JobMatchResult {
  job_title: string;
  company: string;
  match_score: number;
  grade: string;
  matched_skills: string[];
  missing_critical_skills: string[];
  partially_matching_skills: string[];
  experience_match: string;
  education_match: string;
  project_relevance_score: number;
  match_explanation: string;
  recommendations: string[];
  tailoring_suggestions: { section: string; recommendation: string }[];
}

export interface InterviewMessage {
  sender: 'ai' | 'user';
  text: string;
  timestamp?: string;
}

export interface InterviewSessionState {
  current_step: string;
  question_index: number;
  collected_profile: ResumeProfile;
  messages: InterviewMessage[];
  is_complete: boolean;
  last_updated_section?: string;
}

export interface RewriteResponse {
  original_text: string;
  improved_text: string;
  alternatives: string[];
  improvements_made: string[];
}
