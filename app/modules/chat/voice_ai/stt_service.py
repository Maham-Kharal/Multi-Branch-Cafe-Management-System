import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class STTService:
    """
    Speech-To-Text Service integrated with Deepgram Nova-3 API.
    """
    BASE_URL = "https://api.deepgram.com/v1/listen"

    @classmethod
    def transcribe_audio(
        cls,
        audio_bytes: bytes,
        content_type: str = "audio/wav",
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sends audio bytes to Deepgram Nova-3 API for speech transcription.
        """
        api_key = settings.DEEPGRAM_API_KEY
        target_model = model or settings.DEEPGRAM_MODEL or "nova-3"

        if not api_key:
            logger.info("DEEPGRAM_API_KEY not configured. Returning fallback transcript.")
            return {
                "success": False,
                "transcript": "",
                "model": target_model,
                "message": "Deepgram API key not set in .env"
            }

        url = f"{cls.BASE_URL}?model={target_model}&smart_format=true&punctuate=true"
        headers = {
            "Authorization": f"Token {api_key}",
            "Content-Type": content_type
        }

        try:
            req = urllib.request.Request(
                url,
                data=audio_bytes,
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                
                # Extract transcript from Deepgram Nova-3 JSON response structure
                channels = res_data.get("results", {}).get("channels", [])
                transcript = ""
                if channels and len(channels) > 0:
                    alternatives = channels[0].get("alternatives", [])
                    if alternatives and len(alternatives) > 0:
                        transcript = alternatives[0].get("transcript", "")

                return {
                    "success": True,
                    "transcript": transcript,
                    "model": target_model,
                    "message": "Audio successfully transcribed using Deepgram Nova-3"
                }
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8") if e.fp else str(e)
            logger.error(f"Deepgram Nova-3 HTTP Error {e.code}: {err_msg}")
            return {
                "success": False,
                "transcript": "",
                "model": target_model,
                "message": f"Deepgram API Error {e.code}: {err_msg}"
            }
        except Exception as e:
            logger.error(f"Deepgram Nova-3 STT Exception: {str(e)}")
            return {
                "success": False,
                "transcript": "",
                "model": target_model,
                "message": str(e)
            }
