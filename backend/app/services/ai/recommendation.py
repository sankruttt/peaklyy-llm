import logging
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.gig import Gig
from app.models.resume import AIResumeProfile
from app.models.recommendation import GigRecommendation
from app.services.ai.gig_matching import gig_matching_engine
from app.services.ai.llm_service import llm_service

logger = logging.getLogger(__name__)

def generate_match_synthesis(
    match_data: dict,
    profile: AIResumeProfile,
    gig: Gig
) -> str:
    """
    Synthesizes a realistic, truthful explanation of how the candidate's actual resume skills
    align with the specific gig requirements, without false assertions or generic placeholders.
    """
    matched_skills = match_data.get("matched_skills", [])
    missing_skills = match_data.get("missing_skills", [])
    match_percentage = match_data.get("match_percentage", 0.0)
    matched_count = len(matched_skills)
    missing_count = len(missing_skills)

    skills_data = profile.skills or {}
    candidate_top = (
        skills_data.get("strongest_skills")
        or skills_data.get("programming_languages", [])
        or skills_data.get("technical_skills", [])
    )

    # 1. Zero skills matched (Ineligible)
    if matched_count == 0:
        top_str = ", ".join(candidate_top[:3]) if candidate_top else "general software development"
        miss_str = ", ".join(missing_skills[:3]) if missing_skills else "role prerequisites"
        return (
            f"Minimal technical overlap. Your resume highlights {top_str}, "
            f"whereas this {gig.category} contract strictly requires {miss_str}."
        )

    # 2. Exceptional / Strong match (>= 75% or all required skills satisfied)
    if match_percentage >= 75.0 or (missing_count == 0 and match_percentage >= 65.0):
        matched_str = ", ".join(matched_skills[:4])
        if not missing_skills:
            return (
                f"High compatibility: your verified resume competencies in {matched_str} "
                f"fully cover all core requirements for this {gig.experience_level} {gig.category} contract."
            )
        else:
            miss_str = ", ".join(missing_skills[:2])
            return (
                f"Strong alignment: your resume proves hands-on mastery in {matched_str}. "
                f"Adding {miss_str} would make your profile an ideal candidate."
            )

    # 3. Moderate fit (45% - 74%)
    if match_percentage >= 45.0 or matched_count >= 2:
        matched_str = ", ".join(matched_skills[:3])
        miss_str = ", ".join(missing_skills[:3]) if missing_skills else "extended tooling"
        return (
            f"Moderate fit: you satisfy key requirements with {matched_str}, "
            f"but bridging gaps in {miss_str} is necessary for full qualification in this {gig.category} position."
        )

    # 4. Limited coverage (< 45%)
    matched_str = ", ".join(matched_skills[:2])
    miss_str = ", ".join(missing_skills[:3])
    return (
        f"Limited coverage: while your background demonstrates {matched_str}, "
        f"this {gig.experience_level} contract heavily depends on {miss_str}."
    )

class RecommendationService:
    @staticmethod
    async def generate_recommendations(user_id: int, db: Session) -> List[GigRecommendation]:
        """
        Runs hybrid recommendation engine comparing latest user resume profile against all active database gigs.
        """
        # 1. Fetch user's latest AI profile
        profile = (
            db.query(AIResumeProfile)
            .filter(AIResumeProfile.user_id == user_id)
            .order_by(AIResumeProfile.last_analyzed_at.desc())
            .first()
        )
        if not profile:
            return []

        # 2. Fetch all active gigs
        active_gigs = db.query(Gig).filter(Gig.status == "active").all()
        if not active_gigs:
            return []

        # Precompute profile embedding if needed
        profile_text = f"{profile.professional_summary} " + \
            f"Skills: {', '.join((profile.skills or {}).get('strongest_skills', []))} " + \
            f"Interests: {', '.join(profile.interests or [])}"
        profile_embedding = await llm_service.get_embedding(profile_text)

        # 3. Clear previous recommendations for this user to avoid stale duplicate records
        db.query(GigRecommendation).filter(GigRecommendation.user_id == user_id).delete()
        db.commit()

        new_recs = []
        for gig in active_gigs:
            # Check or generate gig embedding
            gig_text = f"{gig.title} in {gig.category}. {gig.description} Required: {', '.join(gig.required_skills or [])}"
            if not gig.embedding:
                gig.embedding = await llm_service.get_embedding(gig_text)
                db.commit()

            match_data = gig_matching_engine.evaluate_match(
                profile=profile,
                gig=gig,
                profile_embedding=profile_embedding,
                gig_embedding=gig.embedding or []
            )

            # Generate dynamic truthful explanation grounded in resume skills
            explanation = generate_match_synthesis(match_data, profile, gig)

            rec = GigRecommendation(
                user_id=user_id,
                gig_id=gig.id,
                match_percentage=match_data["match_percentage"],
                eligibility_status=match_data["eligibility_status"],
                matched_skills=match_data["matched_skills"],
                missing_skills=match_data["missing_skills"],
                recommendation_reason=explanation,
                created_at=datetime.utcnow()
            )
            db.add(rec)
            new_recs.append(rec)

        db.commit()
        
        # Query back ordered by match_percentage desc
        results = (
            db.query(GigRecommendation)
            .filter(GigRecommendation.user_id == user_id)
            .order_by(GigRecommendation.match_percentage.desc())
            .all()
        )
        return results

recommendation_service = RecommendationService()
