from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Shree Radha Studio CRM API"
    API_V1_STR: str = "/api/v1"
    
    # SECURITY
    SECRET_KEY: str = "super_secret_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # DATABASE
    DATABASE_URL: Optional[str] = None
    DATABASE_URL_SYNC: Optional[str] = None

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            # Cloud providers often give postgres://, sqlalchemy async needs postgresql+asyncpg://
            url = self.DATABASE_URL
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return url
        return "sqlite+aiosqlite:///./crm.db"

    @property
    def SQLALCHEMY_DATABASE_URI_SYNC(self) -> str:
        if self.DATABASE_URL_SYNC:
            url = self.DATABASE_URL_SYNC
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            return url
        return "sqlite:///./crm.db"

    # REDIS
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8', case_sensitive=True)

settings = Settings()
