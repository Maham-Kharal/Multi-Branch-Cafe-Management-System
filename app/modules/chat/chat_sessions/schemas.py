from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.modules.chat.chat_sessions.status import ChatSessionStatus


class SessionCreate(BaseModel):
    title: Optional[str] = "New Chat"


class SessionRename(BaseModel):
    title: str


class SessionStatusUpdate(BaseModel):
    status: ChatSessionStatus


class SessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
