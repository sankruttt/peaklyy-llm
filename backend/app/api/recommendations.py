from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.resume import AIResumeProfile
from app.models.recommendation import GigRecommendation
from app.schemas.recommendation import RecommendationOut, RecommendationRefreshResponse
from app.core.security import get_current_user
from app.services.ai.recommendation import recommendation_service

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.get("", response_model=List[RecommendationOut])
async def get_user_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user has existing recommendations
    recs = (
        db.query(GigRecommendation)
        .filter(GigRecommendation.user_id == current_user.id)
        .order_by(GigRecommendation.match_percentage.desc())
        .all()
    )

    # If no recommendations yet, attempt generation if they have an analyzed resume
    if not recs:
        profile = (
            db.query(AIResumeProfile)
            .filter(AIResumeProfile.user_id == current_user.id)
            .first()
        )
        if profile:
            recs = await recommendation_service.generate_recommendations(current_user.id, db)

    return [RecommendationOut.model_validate(r) for r in recs]

@router.post("/refresh", response_model=RecommendationRefreshResponse)
async def refresh_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = (
        db.query(AIResumeProfile)
        .filter(AIResumeProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload and analyze a resume before refreshing recommendations."
        )

    recs = await recommendation_service.generate_recommendations(current_user.id, db)
    return RecommendationRefreshResponse(
        count=len(recs),
        message=f"Successfully generated {len(recs)} AI-powered gig recommendations.",
        recommendations=[RecommendationOut.model_validate(r) for r in recs]
    )

@router.get("/{gig_id}", response_model=RecommendationOut)
def get_recommendation_for_gig(
    gig_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = (
        db.query(GigRecommendation)
        .filter(GigRecommendation.user_id == current_user.id, GigRecommendation.gig_id == gig_id)
        .first()
    )
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No recommendation match calculated for this gig yet."
        )
    return RecommendationOut.model_validate(rec)
