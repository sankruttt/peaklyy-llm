from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ChatMessageCreate(BaseModel):
    message: str
    conversation_id: Optional[int] = None

class ChatMessageOut(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatConversationOut(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageOut] = []

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    conversation_id: int
    message: ChatMessageOut
