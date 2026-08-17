import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Multi-Branch Cafe Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # JWT Authentication Security Settings
    SECRET_KEY: str = "SUPER_SECRET_JWT_KEY_PLEASE_CHANGE_IN_PRODUCTION_64BYTES_LONG"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database Settings (PostgreSQL or SQLite fallback)
    DATABASE_URL: str = "sqlite:///./cafe_management.db"

    # AI & Voice Services Settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = "gpt-oss-120b"
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"  # Standard Free Tier Voice (Rachel)
    ELEVENLABS_MODEL_ID: str = "eleven_turbo_v2_5"      # High-speed Turbo v2.5 model (Free Tier compatible)
    DEEPGRAM_API_KEY: str = os.getenv("DEEPGRAM_API_KEY", "")
    DEEPGRAM_MODEL: str = "nova-3"



    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
