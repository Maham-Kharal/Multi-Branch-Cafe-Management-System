from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_token_payload, TokenData
from app.modules.orchestrator.engine import OrchestratorEngine
from app.modules.chat.chat_sessions.service import ChatSessionService
from app.modules.chat.voice_ai.stt_service import STTService

router = APIRouter(prefix="/orchestrator", tags=["AI Supervisor Orchestrator"])


class ProcessRequest(BaseModel):
    session_id: str
    prompt: str
    generate_voice: Optional[bool] = False


@router.post("/process")
def process_ai_request(
    data: ProcessRequest,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_token_payload),
):
    """
    Main Orchestrator endpoint: Takes user prompt, executes Groq LLM tool calling,
    persists chat messages, and returns formatted response & tool execution results.
    """
    session = ChatSessionService.get_session_by_id(db, data.session_id, user_id=current_user.user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or unauthorized"
        )

    result = OrchestratorEngine.process_user_request(
        db,
        session_id=data.session_id,
        user_prompt=data.prompt,
        generate_voice=data.generate_voice or False,
        user_role=current_user.role,
        user_id=current_user.user_id
    )
    return result


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(get_current_token_payload),
):
    """
    Transcribes audio recorded in browser using Deepgram Nova-3 API.
    """
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    content_type = file.content_type or "audio/wav"
    result = STTService.transcribe_audio(audio_bytes, content_type=content_type)
    return result
