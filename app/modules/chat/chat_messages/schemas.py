from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, ConfigDict


class MessageCreate(BaseModel):
    session_id: str
    content: str
    sender: Optional[str] = "USER"
    metadata_json: Optional[Dict[str, Any]] = None


class MessageUpdate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: str
    session_id: str
    sender: str
    content: str
    metadata_json: Optional[Dict[str, Any]] = None
    is_edited: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
