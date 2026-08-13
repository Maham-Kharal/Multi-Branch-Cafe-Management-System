from typing import List, Optional
from sqlalchemy.orm import Session
from app.common.utils import generate_uuid, utc_now
from app.modules.chat.chat_sessions.models import ChatSession
from app.modules.chat.chat_sessions.schemas import SessionCreate, SessionRename, SessionStatusUpdate


class ChatSessionService:
    @staticmethod
    def create_session(db: Session, user_id: str, data: SessionCreate) -> ChatSession:
        session_id = generate_uuid()
        db_session = ChatSession(
            id=session_id,
            user_id=user_id,
            title=data.title or "New Chat"
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        return db_session

    @staticmethod
    def get_session_by_id(db: Session, session_id: str, user_id: str) -> Optional[ChatSession]:
        return db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id
        ).first()

    @staticmethod
    def list_user_sessions(db: Session, user_id: str) -> List[ChatSession]:
        return db.query(ChatSession).filter(
            ChatSession.user_id == user_id
        ).order_by(ChatSession.updated_at.desc()).all()

    @staticmethod
    def rename_session(db: Session, session: ChatSession, data: SessionRename) -> ChatSession:
        session.title = data.title
        session.updated_at = utc_now()
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def update_status(db: Session, session: ChatSession, data: SessionStatusUpdate) -> ChatSession:
        session.status = data.status.value
        session.updated_at = utc_now()
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def delete_session(db: Session, session: ChatSession) -> bool:
        db.delete(session)
        db.commit()
        return True
