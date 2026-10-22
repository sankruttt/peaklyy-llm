from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field

class SkillProficiency(BaseModel):
    skill: str
    level: str = "Intermediate"  # Beginner, Intermediate, Advanced, Expert
    type: str = "explicit"  # explicit, inferred

class SkillsStructured(BaseModel):
    programming_languages: list[str] = Field(default_factory=list)
    frameworks: list[str] = Field(default_factory=list)
    libraries: list[str] = Field(default_factory=list)
    databases: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    technical_skills: list[str] = Field(default_factory=list)
    soft_skills: list[str] = Field(default_factory=list)
    proficiencies: list[SkillProficiency] = Field(default_factory=list)
    strongest_skills: list[str] = Field(default_factory=list)

class ExperienceItem(BaseModel):
    role: str
    company_or_org: Optional[str] = "Independent / Project"
    duration: Optional[str] = None
    responsibilities: list[str] = Field(default_factory=list)
    technologies_used: list[str] = Field(default_factory=list)

class EducationItem(BaseModel):
    institution: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_year: Optional[str] = None

class ProjectItem(BaseModel):
    name: str
    description: Optional[str] = None
    technologies_used: list[str] = Field(default_factory=list)
    skills_demonstrated: list[str] = Field(default_factory=list)

class CertificationItem(BaseModel):
    name: str
    issuing_organization: Optional[str] = None
    date: Optional[str] = None

class AIResumeProfileStructured(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    professional_summary: str = ""
    skills: SkillsStructured = Field(default_factory=SkillsStructured)
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    certifications: list[CertificationItem] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    career_suggestions: list[str] = Field(default_factory=list)
    potential_job_and_gig_categories: list[str] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    resume_improvement_suggestions: list[str] = Field(default_factory=list)

class AIResumeProfileOut(BaseModel):
    id: int
    user_id: int
    resume_id: int
    professional_summary: Optional[str]
    skills: dict[str, Any]
    experience: list[Any]
    education: list[Any]
    projects: list[Any]
    certifications: list[Any]
    interests: list[Any]
    strengths: list[Any]
    weaknesses: list[Any]
    career_suggestions: list[Any]
    last_analyzed_at: datetime

    class Config:
        from_attributes = True

class ResumeOut(BaseModel):
    id: int
    user_id: int
    file_name: str
    file_type: str
    uploaded_at: datetime
    analysis_status: str
    ai_profile: Optional[AIResumeProfileOut] = None

    class Config:
        from_attributes = True
