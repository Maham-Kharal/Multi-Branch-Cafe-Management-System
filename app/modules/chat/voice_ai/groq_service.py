import json
import logging
from typing import List, Dict, Any, Optional
import urllib.request
import urllib.error

from app.core.config import settings
from app.modules.orchestrator.prompts import SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class GroqService:
    GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

    @classmethod
    def _call_groq_api(cls, payload: Dict[str, Any], api_key: str) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        req = urllib.request.Request(
            cls.GROQ_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=20) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            choice = res_data["choices"][0]["message"]
            return {
                "content": choice.get("content") or "",
                "tool_calls": choice.get("tool_calls") or []
            }

    @classmethod
    def generate_chat_completion(
        cls,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calls Groq API (api.groq.com) for fast LLM inference with tool calling support
        and automatic model fallback on 429 rate limits.
        """
        api_key = settings.GROQ_API_KEY
        if not api_key:
            logger.warning("GROQ_API_KEY not configured in .env.")
            return {
                "content": "Groq API key is not configured. Please set `GROQ_API_KEY` in your `.env` file.",
                "tool_calls": []
            }

        primary_model = model or getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile")
        
        # Sequence of free tier models to try if primary model hits rate limits
        models_to_try = [primary_model, "llama-3.1-8b-instant", "mixtral-8x7b-32768"]
        models_to_try = list(dict.fromkeys(models_to_try))

        payload_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

        for current_model in models_to_try:
            payload: Dict[str, Any] = {
                "model": current_model,
                "messages": payload_messages,
                "temperature": 0.1,
                "max_tokens": 1024
            }

            if tools and len(tools) > 0:
                payload["tools"] = tools
                payload["tool_choice"] = "auto"

            try:
                result = cls._call_groq_api(payload, api_key)
                return result
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8") if e.fp else str(e)
                logger.warning(f"Groq API Error {e.code} for model '{current_model}': {err_body}")

                # If rate limit 429 hit, try next fallback model (e.g. llama-3.1-8b-instant)
                if e.code == 429:
                    logger.info(f"Groq model '{current_model}' rate limit reached (429). Retrying with fallback model...")
                    continue

                if e.code in (401, 403):
                    return {
                        "content": "⚠️ **Groq API Access Forbidden (HTTP 403/401)**\n\nYour `GROQ_API_KEY` in `.env` is invalid or missing permission.\n\nPlease generate a new free key at [https://console.groq.com/keys](https://console.groq.com/keys).",
                        "tool_calls": []
                    }

                return {
                    "content": f"I'm sorry, I encountered an issue connecting to Groq AI: {e.reason} ({e.code})",
                    "tool_calls": []
                }
            except Exception as e:
                logger.error(f"Groq Service Exception: {str(e)}")
                return {
                    "content": f"Apologies, there was an unexpected error communicating with Groq AI: {str(e)}",
                    "tool_calls": []
                }

        return {
            "content": "⚠️ Groq AI rate limit reached across all free tier models. Please wait a few minutes or upgrade key at https://console.groq.com.",
            "tool_calls": []
        }
