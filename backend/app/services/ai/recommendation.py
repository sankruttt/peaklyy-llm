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

            # Generate dynamic explanation
            matched_str = ", ".join(match_data["matched_skills"][:4]) if match_data["matched_skills"] else "foundational competencies"
            missing_str = f" Upskilling in {', '.join(match_data['missing_skills'][:2])} will maximize your competitiveness." if match_data["missing_skills"] else " You cover all key prerequisites!"
            
            explanation = f"Your experience with {matched_str} aligns strongly with this {gig.experience_level} {gig.category} role.{missing_str}"

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
