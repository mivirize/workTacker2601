"""
Task (Video) Model
"""
from enum import Enum
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class TaskStatus(str, Enum):
    PLANNED = "planned"
    PROCESSING = "processing"
    DOWNLOADED = "downloaded"
    UPLOADED = "uploaded"
    FAILED = "failed"


class Task(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(Text)
    summary = Column(Text)
    script = Column(Text)
    status = Column(String, default=TaskStatus.PLANNED.value)
    file_path = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # New columns for parallel processing
    assigned_worker_id = Column(String, nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    error_message = Column(Text, nullable=True)
    lock_version = Column(Integer, default=0)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "summary": self.summary,
            "script": self.script,
            "status": self.status,
            "file_path": self.file_path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "assigned_worker_id": self.assigned_worker_id,
            "assigned_at": self.assigned_at.isoformat() if self.assigned_at else None,
            "retry_count": self.retry_count,
        }
