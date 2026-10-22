from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class Gig(Base):
    __tablename__ = "gigs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    required_skills = Column(JSON, nullable=False, default=list)
    preferred_skills = Column(JSON, nullable=False, default=list)
    experience_level = Column(String(50), nullable=False, default="Intermediate")  # Entry, Intermediate, Senior, Lead
    eligibility_requirements = Column(JSON, nullable=False, default=list)  # list of rules/criteria
    location = Column(String(100), nullable=False, default="Remote")
    work_type = Column(String(50), nullable=False, default="Contract")  # Contract, Full-time, Freelance, Part-time
    compensation = Column(String(100), nullable=False)
    duration = Column(String(100), nullable=False, default="3 Months")
    application_deadline = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False, default="active", index=True)
    
    # Semantic embedding vector cache for hybrid search
    embedding = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    recommendations = relationship("GigRecommendation", back_populates="gig", cascade="all, delete-orphan")
