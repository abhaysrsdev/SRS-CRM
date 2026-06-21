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
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "crm_db"
    POSTGRES_PORT: str = "5432"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # Use SQLite for local development since Docker is not available
        return "sqlite+aiosqlite:///./crm.db"

    @property
    def SQLALCHEMY_DATABASE_URI_SYNC(self) -> str:
        return "sqlite:///./crm.db"

    # REDIS
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8', case_sensitive=True)

settings = Settings()
