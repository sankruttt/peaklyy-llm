from datetime import datetime
from pydantic import BaseModel
from app.schemas.gig import GigOut

class RecommendationOut(BaseModel):
    id: int
    user_id: int
    gig_id: int
    match_percentage: float
    eligibility_status: str
    matched_skills: list[str]
    missing_skills: list[str]
    recommendation_reason: str
    created_at: datetime
    gig: GigOut

    class Config:
        from_attributes = True

class RecommendationRefreshResponse(BaseModel):
    count: int
    message: str
    recommendations: list[RecommendationOut]
