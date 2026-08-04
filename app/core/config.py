import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Multi-Branch Cafe Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # JWT Authentication Security Settings
    SECRET_KEY: str = "SUPER_SECRET_JWT_KEY_PLEASE_CHANGE_IN_PRODUCTION_64BYTES_LONG"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database Settings (Default: SQLite for zero-setup local dev; configurable via ENV)
    DATABASE_URL: str = "sqlite:///./cafe_management.db"

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
