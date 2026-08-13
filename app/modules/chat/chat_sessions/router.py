from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_token_payload, TokenData
from app.modules.chat.chat_sessions.schemas import (
    SessionCreate,
    SessionRename,
    SessionStatusUpdate,
    SessionResponse,
)
from app.modules.chat.chat_sessions.service import ChatSessionService

router = APIRouter(prefix="/chat/sessions", tags=["Chat Sessions"])


@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_chat_session(
    data: SessionCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_token_payload),
):
    """Creates a new chat session for the current authenticated user."""
    return ChatSessionService.create_session(db, user_id=current_user.user_id, data=data)


@router.get("/", response_model=List[SessionResponse])
def list_chat_sessions(
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_token_payload),
):
    """Lists all chat sessions owned by the current authenticated user."""
    return ChatSessionService.list_user_sessions(db, user_id=current_user.user_id)


@router.get("/{session_id}", response_model=SessionResponse)
def get_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_token_payload),
):
    """Fetches details of a specific chat session."""
    session = ChatSessionService.get_session_by_id(db, session_id, user_id=current_user.user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    return session


@router.patch("/{session_id}/title", response_model=SessionResponse)
def rename_chat_session(
    session_id: str,
    data: SessionRename,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_token_payload),
):
    """Renames the title of a chat session."""
    session = ChatSessionService.get_session_by_id(db, session_id, user_id=current_user.user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    return ChatSessionService.rename_session(db, session, data)


@router.patch("/{session_id}/status", response_model=SessionResponse)
def update_chat_session_status(
    session_id: str,
    data: SessionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_token_payload),
):
    """Updates the active/archived/completed status of a chat session."""
    session = ChatSessionService.get_session_by_id(db, session_id, user_id=current_user.user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    return ChatSessionService.update_status(db, session, data)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_token_payload),
):
    """Deletes a chat session and cascade-deletes all its messages."""
    session = ChatSessionService.get_session_by_id(db, session_id, user_id=current_user.user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    ChatSessionService.delete_session(db, session)
    return None
