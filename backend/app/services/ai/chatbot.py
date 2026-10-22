import json
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.models.conversation import AIConversation, AIMessage
from app.models.user import User
from app.services.ai.context_retrieval import context_retrieval_service
from app.services.ai.llm_service import llm_service

logger = logging.getLogger(__name__)

CAREER_ASSISTANT_SYSTEM_PROMPT = """
You are the Peaklyy AI Career Assistant & Gig Advisor.
You are a top-tier career coach, technical mentor, and gig opportunity expert.

Context provided to you:
- Whether the user has uploaded an analyzed resume.
- Their structured resume profile (skills, proficiencies, experience, projects, education, strengths, weaknesses).
- Real active gig opportunities in the Peaklyy database and the user's computed match recommendations.
- Recent conversation history.

Guidelines:
1. Grounding & Personalization:
   - When asked about their resume, skills, or gig recommendations, ground your answer in their actual profile and active database gigs.
   - If they refer to previous items (e.g. "Why is the second one better?", "What was my weakness?"), use conversation history and recommendations context accurately.
2. Directness & Warmth:
   - Be inspiring, clear, actionable, and structured with markdown headings/bullet points where helpful.
3. No Resume State:
   - If the user has NOT uploaded a resume yet, provide excellent general career guidance, explain interview or tech concepts, and gently highlight how uploading their resume in the Resume section will unlock personalized match ratings and custom advice.
4. General Questions:
   - Answer general technical questions (e.g., "What is the difference between React and Angular?", "How to prepare for system design?") thoroughly without forcing artificial links to the resume unless relevant.
5. Truthfulness:
   - Never invent nonexistent gigs. Only reference real gigs from the context.
"""

class ChatbotService:
    @staticmethod
    async def process_chat(
        user: User,
        message_text: str,
        conversation_id: Optional[int],
        db: Session
    ) -> AIMessage:
        """
        Processes chat message, injects context, queries LLM, and persists message & conversation.
        """
        # 1. Retrieve or create conversation
        if conversation_id:
            conversation = (
                db.query(AIConversation)
                .filter(AIConversation.id == conversation_id, AIConversation.user_id == user.id)
                .first()
            )
            if not conversation:
                conversation = AIConversation(
                    user_id=user.id,
                    title=message_text[:40] + ("..." if len(message_text) > 40 else "")
                )
                db.add(conversation)
                db.commit()
                db.refresh(conversation)
        else:
            conversation = AIConversation(
                user_id=user.id,
                title=message_text[:40] + ("..." if len(message_text) > 40 else "")
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        # 2. Record user message
        user_msg = AIMessage(
            conversation_id=conversation.id,
            role="user",
            content=message_text,
            created_at=datetime.utcnow()
        )
        db.add(user_msg)
        db.commit()

        # 3. Retrieve context
        context_data = context_retrieval_service.build_user_context(
            user_id=user.id,
            db=db,
            conversation_id=conversation.id
        )

        # 4. Construct prompt
        profile_summary = "No resume uploaded yet."
        if context_data["has_resume"] and context_data["profile"]:
            prof = context_data["profile"]
            profile_summary = f"""
Candidate Name: {user.name}
Summary: {prof.professional_summary}
Skills: {json.dumps(prof.skills)}
Experience: {json.dumps(prof.experience)}
Education: {json.dumps(prof.education)}
Projects: {json.dumps(prof.projects)}
Strengths: {json.dumps(prof.strengths)}
Weaknesses: {json.dumps(prof.weaknesses)}
Career Suggestions: {json.dumps(prof.career_suggestions)}
"""

        recs_str = json.dumps(context_data["recommendations"], indent=2)
        gigs_str = json.dumps(context_data["gigs"], indent=2)

        history_str = ""
        for h in context_data["history"][-8:]:
            history_str += f"{h['role'].upper()}: {h['content']}\n\n"

        prompt = f"""
=== CONTEXT: USER RESUME PROFILE ===
{profile_summary}

=== CONTEXT: USER TOP GIG RECOMMENDATIONS ===
{recs_str}

=== CONTEXT: AVAILABLE DATABASE GIGS ===
{gigs_str}

=== CONVERSATION HISTORY ===
{history_str}

USER: {message_text}

ASSISTANT:
"""

        # 5. Call LLM
        try:
            response_text = await llm_service.generate_text(
                prompt=prompt,
                system_instruction=CAREER_ASSISTANT_SYSTEM_PROMPT,
                json_mode=False
            )
        except ValueError as ve:
            response_text = (
                "The Peaklyy AI Career Assistant is currently offline because an LLM API key has not been configured. "
                "Please configure your LLM_API_KEY in backend/.env to start chatting."
            )

        # 6. Record assistant message
        assistant_msg = AIMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=response_text,
            created_at=datetime.utcnow()
        )
        db.add(assistant_msg)
        conversation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(assistant_msg)

        return assistant_msg

chatbot_service = ChatbotService()
