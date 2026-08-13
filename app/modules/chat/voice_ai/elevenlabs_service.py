import json
import logging
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class ElevenLabsService:
    DEFAULT_FREE_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # Bella (100% Free Tier API Voice)
    DEFAULT_MODEL_ID = "eleven_multilingual_v2"
    BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech"

    @classmethod
    def _call_elevenlabs_api(
        cls,
        text: str,
        voice_id: str,
        model_id: str,
        api_key: str
    ) -> Optional[bytes]:

        url = f"{cls.BASE_URL}/{voice_id}"

        payload = {
            "text": text,
            "model_id": model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        }

        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )

        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read()

        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            logger.warning(
                f"ElevenLabs HTTP Error {e.code} for voice '{voice_id}' model '{model_id}': {error_body}"
            )
            raise

    @classmethod
    def generate_speech(
        cls,
        text: str,
        voice_id: Optional[str] = None
    ) -> Dict[str, Any]:

        api_key = settings.ELEVENLABS_API_KEY
        if not api_key:
            return {
                "success": False,
                "audio_bytes": None,
                "voice_id": None,
                "model_used": None,
                "message": "ElevenLabs API key is not configured."
            }

        if not text or not text.strip():
            return {
                "success": False,
                "audio_bytes": None,
                "voice_id": None,
                "model_used": None,
                "message": "Text is empty."
            }

        # Preferred voices to try: explicit voice_id, configured .env voice_id, and guaranteed free default voice
        requested_voice = voice_id or settings.ELEVENLABS_VOICE_ID
        voices_to_try = [requested_voice, cls.DEFAULT_FREE_VOICE_ID] if requested_voice else [cls.DEFAULT_FREE_VOICE_ID]
        voices_to_try = [v for v in dict.fromkeys(voices_to_try) if v]

        models_to_try = ["eleven_multilingual_v2", "eleven_flash_v2_5"]

        for target_voice in voices_to_try:
            for model in models_to_try:
                try:
                    audio_bytes = cls._call_elevenlabs_api(
                        text=text,
                        voice_id=target_voice,
                        model_id=model,
                        api_key=api_key
                    )

                    if audio_bytes:
                        logger.info(
                            f"ElevenLabs speech generated successfully using voice '{target_voice}' and model '{model}'"
                        )
                        return {
                            "success": True,
                            "audio_bytes": audio_bytes,
                            "voice_id": target_voice,
                            "model_used": model,
                            "message": "Speech generated successfully"
                        }
                except urllib.error.HTTPError as e:
                    # If voice fails due to paid restriction or deprecation, continue trying fallback voice/model
                    continue
                except Exception as e:
                    logger.warning(f"ElevenLabs error for voice '{target_voice}' model '{model}': {e}")
                    continue

        return {
            "success": False,
            "audio_bytes": None,
            "voice_id": None,
            "model_used": None,
            "message": "All ElevenLabs TTS models/voices failed."
        }