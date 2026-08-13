from typing import List, Optional
from sqlalchemy.orm import Session
from app.common.utils import generate_uuid, utc_now
from app.modules.chat.chat_messages.models import ChatMessage
from app.modules.chat.chat_messages.schemas import MessageCreate, MessageUpdate


class ChatMessageService:
    @staticmethod
    def create_message(
        db: Session,
        session_id: str,
        content: str,
        sender: str = "USER",
        metadata_json: Optional[dict] = None
    ) -> ChatMessage:
        msg_id = generate_uuid()
        db_message = ChatMessage(
            id=msg_id,
            session_id=session_id,
            sender=sender,
            content=content,
            metadata_json=metadata_json or {},
            is_edited=False
        )
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
        return db_message

    @staticmethod
    def get_message_by_id(db: Session, message_id: str) -> Optional[ChatMessage]:
        return db.query(ChatMessage).filter(ChatMessage.id == message_id).first()

    @staticmethod
    def list_messages_for_session(db: Session, session_id: str) -> List[ChatMessage]:
        return db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.created_at.asc()).all()

    @staticmethod
    def update_message(db: Session, message: ChatMessage, data: MessageUpdate) -> ChatMessage:
        message.content = data.content
        message.is_edited = True
        message.updated_at = utc_now()
        db.commit()
        db.refresh(message)
        return message

    @staticmethod
    def delete_message(db: Session, message: ChatMessage) -> bool:
        db.delete(message)
        db.commit()
        return True
