import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Peaklyy"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres@localhost:5432/peaklyy_db"
    
    # Security
    JWT_SECRET: str = "peaklyy-super-secret-jwt-key-2026-replace-in-production-secure"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # File Storage
    UPLOAD_STORAGE_PATH: str = "/tmp/storage/resumes" if os.environ.get("VERCEL") else os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../storage/resumes"))
    MAX_FILE_SIZE_MB: int = 15
    
    # AI / LLM Configuration
    # Supported providers: "openai", "openrouter", "gemini", or "groq"
    LLM_PROVIDER: str = "openai"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "google/gemma-4-31b-it:free"
    EMBEDDING_MODEL: str = "text-embedding-004"
    LLM_BASE_URL: Optional[str] = "https://openrouter.ai/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

    model_config = SettingsConfigDict(
        env_file=(
            os.path.join(os.path.dirname(__file__), "../../.env"),
            os.path.join(os.path.dirname(__file__), "../../../.env"),
            ".env"
        ),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
