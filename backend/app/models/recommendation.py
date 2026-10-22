from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class GigRecommendation(Base):
    __tablename__ = "gig_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    gig_id = Column(Integer, ForeignKey("gigs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    match_percentage = Column(Float, nullable=False)
    eligibility_status = Column(String(50), nullable=False)  # Eligible, Partially Eligible, Ineligible
    matched_skills = Column(JSON, nullable=False, default=list)
    missing_skills = Column(JSON, nullable=False, default=list)
    recommendation_reason = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="recommendations")
    gig = relationship("Gig", back_populates="recommendations")
