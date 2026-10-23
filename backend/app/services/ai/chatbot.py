import json
import logging
import re
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.models.conversation import AIConversation, AIMessage
from app.models.user import User
from app.services.ai.context_retrieval import context_retrieval_service
from app.services.ai.llm_service import llm_service

logger = logging.getLogger(__name__)

EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"
    "\U0001F300-\U0001F5FF"
    "\U0001F680-\U0001F6FF"
    "\U0001F1E0-\U0001F1FF"
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "\U0001F900-\U0001F9FF"
    "\U0001FA70-\U0001FAFF"
    "]+",
    flags=re.UNICODE
)

def remove_emojis(text: str) -> str:
    if not text:
        return ""
    return EMOJI_PATTERN.sub("", text).strip()

CAREER_ASSISTANT_SYSTEM_PROMPT = """
You are the Peaklyy AI Career Assistant & Gig Advisor.
You are a sharp, top-tier technical mentor and contract advisor.

STRICT FORMATTING & STYLE CONSTRAINTS:
1. SHORT & CONCISE: Deliver compact, focused answers. Never write walls of text. Limit responses to 2-3 brief paragraphs or short bulleted items. Get straight to the point without filler introductions.
2. WELL FORMATTED: Use clean GitHub markdown with bold key terms, concise bullet points, and high readability.
3. ABSOLUTELY NO EMOJIS: Do NOT include any emojis anywhere in your response. Strictly zero emojis under all circumstances.
4. GROUNDED IN REAL DATA: Base answers on the candidate's actual resume profile and active database gigs. Never invent nonexistent gigs.
5. DIRECT & ACTIONABLE: Provide concrete advice, skill remediation targets, or compensation negotiation strategy.
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

        response_text = remove_emojis(response_text)

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
