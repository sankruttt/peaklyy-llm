from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.resume import AIResumeProfile
from app.models.recommendation import GigRecommendation
from app.models.gig import Gig
from app.models.conversation import AIMessage

class ContextRetrievalService:
    @staticmethod
    def build_user_context(user_id: int, db: Session, conversation_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Retrieves user's latest resume analysis, top gig recommendations, available gigs, and conversation history.
        """
        # 1. Latest AI resume profile
        profile = (
            db.query(AIResumeProfile)
            .filter(AIResumeProfile.user_id == user_id)
            .order_by(AIResumeProfile.last_analyzed_at.desc())
            .first()
        )

        # 2. User's top gig recommendations
        recommendations = (
            db.query(GigRecommendation)
            .filter(GigRecommendation.user_id == user_id)
            .order_by(GigRecommendation.match_percentage.desc())
            .limit(5)
            .all()
        )

        recs_summary = []
        for r in recommendations:
            recs_summary.append({
                "gig_id": r.gig_id,
                "title": r.gig.title if r.gig else f"Gig #{r.gig_id}",
                "category": r.gig.category if r.gig else "",
                "match_percentage": r.match_percentage,
                "eligibility_status": r.eligibility_status,
                "matched_skills": r.matched_skills,
                "missing_skills": r.missing_skills,
                "reason": r.recommendation_reason
            })

        # 3. Available gigs snapshot
        gigs = db.query(Gig).filter(Gig.status == "active").limit(10).all()
        gigs_summary = [
            {
                "id": g.id,
                "title": g.title,
                "category": g.category,
                "experience_level": g.experience_level,
                "compensation": g.compensation,
                "required_skills": g.required_skills
            }
            for g in gigs
        ]

        # 4. Recent conversation history if conversation_id provided
        history_messages = []
        if conversation_id:
            db_msgs = (
                db.query(AIMessage)
                .filter(AIMessage.conversation_id == conversation_id)
                .order_by(AIMessage.created_at.asc())
                .limit(20)
                .all()
            )
            for m in db_msgs:
                history_messages.append({"role": m.role, "content": m.content})

        return {
            "has_resume": profile is not None,
            "profile": profile,
            "recommendations": recs_summary,
            "gigs": gigs_summary,
            "history": history_messages
        }

context_retrieval_service = ContextRetrievalService()
