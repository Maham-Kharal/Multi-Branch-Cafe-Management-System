from enum import Enum


class ChatSessionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    VOICE_ACTIVE = "VOICE_ACTIVE"
    COMPLETED = "COMPLETED"
