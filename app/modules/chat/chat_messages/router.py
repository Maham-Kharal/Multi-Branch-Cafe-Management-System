from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_token_payload, TokenData
from app.modules.chat.chat_sessions.service import ChatSessionService
from app.modules.chat.chat_messages.schemas import MessageCreate, MessageUpdate, MessageResponse
from app.modules.chat.chat_messages.service import ChatMessageService

router = APIRouter(prefix="/chat/messages", tags=["Chat Messages"])


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def create_message(
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_token_payload),
):
    """Sends/posts a message in an existing chat session."""
    session = ChatSessionService.get_session_by_id(db, data.session_id, user_id=current_user.user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or unauthorized access"
        )
    
    return ChatMessageService.create_message(
        db,
        session_id=data.session_id,
        content=data.content,
        sender=data.sender or "USER",
        metadata_json=data.metadata_json
    )


@router.get("/session/{session_id}", response_model=List[MessageResponse])
def get_session_messages(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_token_payload),
):
    """Retrieves all conversation messages for a specific session."""
    session = ChatSessionService.get_session_by_id(db, session_id, user_id=current_user.user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or unauthorized access"
        )
    return ChatMessageService.list_messages_for_session(db, session_id=session_id)


@router.patch("/{message_id}", response_model=MessageResponse)
def update_message(
    message_id: str,
    data: MessageUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_token_payload),
):
    """Updates/edits a previously sent message."""
    message = ChatMessageService.get_message_by_id(db, message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Verify session ownership
    session = ChatSessionService.get_session_by_id(db, message.session_id, user_id=current_user.user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to modify message in this session"
        )
        
    return ChatMessageService.update_message(db, message, data)


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_token_payload),
):
    """Deletes a message from a session."""
    message = ChatMessageService.get_message_by_id(db, message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Verify session ownership
    session = ChatSessionService.get_session_by_id(db, message.session_id, user_id=current_user.user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to delete message in this session"
        )

    ChatMessageService.delete_message(db, message)
    return None
