export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface SkillProficiency {
  skill: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  type: "explicit" | "inferred";
}

export interface SkillsData {
  programming_languages?: string[];
  frameworks?: string[];
  libraries?: string[];
  databases?: string[];
  tools?: string[];
  technical_skills?: string[];
  soft_skills?: string[];
  proficiencies?: SkillProficiency[];
  strongest_skills?: string[];
}

export interface ExperienceItem {
  role: string;
  company_or_org?: string;
  duration?: string;
  responsibilities?: string[];
  technologies_used?: string[];
}

export interface EducationItem {
  institution: string;
  degree?: string;
  field_of_study?: string;
  graduation_year?: string;
}

export interface ProjectItem {
  name: string;
  description?: string;
  technologies_used?: string[];
  skills_demonstrated?: string[];
}

export interface CertificationItem {
  name: string;
  issuing_organization?: string;
  date?: string;
}

export interface AIResumeProfile {
  id: number;
  user_id: number;
  resume_id: number;
  professional_summary?: string;
  skills: SkillsData;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  interests: string[];
  strengths: string[];
  weaknesses: string[];
  career_suggestions: string[];
  last_analyzed_at: string;
}

export interface Resume {
  id: number;
  user_id: number;
  file_name: string;
  file_type: string;
  uploaded_at: string;
  analysis_status: "pending" | "analyzing" | "completed" | "failed";
  ai_profile?: AIResumeProfile;
}

export interface Gig {
  id: number;
  title: string;
  company?: string;
  description: string;
  category: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string;
  eligibility_requirements: string[];
  location: string;
  work_type: string;
  compensation: string;
  duration: string;
  application_deadline?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GigRecommendation {
  id: number;
  user_id: number;
  gig_id: number;
  match_percentage: number;
  eligibility_status: "Eligible" | "Partially Eligible" | "Ineligible";
  matched_skills: string[];
  missing_skills: string[];
  recommendation_reason: string;
  created_at: string;
  gig: Gig;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface ChatConversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}
