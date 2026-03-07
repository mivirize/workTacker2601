"""
Configuration management for Orchestrator
"""
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # Database
    database_path: Path = Path(__file__).parent.parent.parent / "database.db"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # Worker monitoring
    heartbeat_timeout_seconds: int = 120
    stale_task_timeout_seconds: int = 1800  # 30 minutes (video generation takes time)

    # Task settings
    max_retries: int = 3

    class Config:
        env_file = ".env"
        env_prefix = "ORCHESTRATOR_"


settings = Settings()
