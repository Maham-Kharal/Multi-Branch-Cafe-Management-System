import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional


def generate_uuid() -> str:
    """Generates a standard string representation of a UUID4."""
    return str(uuid.uuid4())


def utc_now() -> datetime:
    """Returns the current timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


def format_api_response(
    data: Any = None,
    message: str = "Success",
    status_code: int = 200,
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Standardized API JSON response wrapper structure."""
    response = {
        "status_code": status_code,
        "message": message,
        "data": data,
    }
    if meta:
        response["meta"] = meta
    return response
