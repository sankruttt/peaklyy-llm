from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.conversation import AIConversation
from app.schemas.chat import (
    ChatMessageCreate,
    ChatResponse,
    ChatConversationOut,
    ChatMessageOut
)
from app.core.security import get_current_user
from app.services.ai.chatbot import chatbot_service

router = APIRouter(prefix="/ai", tags=["AI Career Assistant"])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    chat_in: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not chat_in.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    assistant_msg = await chatbot_service.process_chat(
        user=current_user,
        message_text=chat_in.message.strip(),
        conversation_id=chat_in.conversation_id,
        db=db
    )

    return ChatResponse(
        conversation_id=assistant_msg.conversation_id,
        message=ChatMessageOut.model_validate(assistant_msg)
    )

@router.get("/conversations", response_model=List[ChatConversationOut])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversations = (
        db.query(AIConversation)
        .filter(AIConversation.user_id == current_user.id)
        .order_by(AIConversation.updated_at.desc())
        .all()
    )
    return [ChatConversationOut.model_validate(c) for c in conversations]

@router.get("/conversations/{conversation_id}", response_model=ChatConversationOut)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = (
        db.query(AIConversation)
        .filter(AIConversation.id == conversation_id, AIConversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    return ChatConversationOut.model_validate(conv)

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = (
        db.query(AIConversation)
        .filter(AIConversation.id == conversation_id, AIConversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    db.delete(conv)
    db.commit()
    return None
