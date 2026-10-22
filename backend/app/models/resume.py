from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(1024), nullable=False)
    file_type = Column(String(50), nullable=False)  # "pdf" or "docx"
    extracted_text = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    analysis_status = Column(String(50), default="pending", nullable=False)  # pending, analyzing, completed, failed

    # Relationships
    user = relationship("User", back_populates="resumes")
    ai_profile = relationship("AIResumeProfile", back_populates="resume", uselist=False, cascade="all, delete-orphan")

class AIResumeProfile(Base):
    __tablename__ = "ai_resume_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    professional_summary = Column(Text, nullable=True)
    skills = Column(JSON, nullable=False, default=dict)  # structured categories, proficiencies, etc.
    experience = Column(JSON, nullable=False, default=list)  # list of work experiences
    education = Column(JSON, nullable=False, default=list)  # list of education
    projects = Column(JSON, nullable=False, default=list)  # list of projects
    certifications = Column(JSON, nullable=False, default=list)  # list of certifications
    interests = Column(JSON, nullable=False, default=list)  # list of technical/career interests
    strengths = Column(JSON, nullable=False, default=list)  # list of key strengths
    weaknesses = Column(JSON, nullable=False, default=list)  # list of key weaknesses
    career_suggestions = Column(JSON, nullable=False, default=list)  # list of suggestions & potential gig categories
    
    last_analyzed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="ai_profiles")
    resume = relationship("Resume", back_populates="ai_profile")
