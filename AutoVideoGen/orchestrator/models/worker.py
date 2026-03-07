"""
Worker Model
"""
from enum import Enum
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class WorkerStatus(str, Enum):
    ACTIVE = "active"
    IDLE = "idle"
    BUSY = "busy"
    OFFLINE = "offline"


class Worker(Base):
    __tablename__ = "workers"

    id = Column(String, primary_key=True)
    hostname = Column(String, nullable=False)
    ip_address = Column(String, nullable=False)
    status = Column(String, default=WorkerStatus.ACTIVE.value)
    current_task_id = Column(Integer, nullable=True)
    last_heartbeat_at = Column(DateTime, nullable=True)
    registered_at = Column(DateTime, default=datetime.utcnow)
    total_tasks_completed = Column(Integer, default=0)
    total_tasks_failed = Column(Integer, default=0)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "hostname": self.hostname,
            "ip_address": self.ip_address,
            "status": self.status,
            "current_task_id": self.current_task_id,
            "last_heartbeat_at": self.last_heartbeat_at.isoformat() if self.last_heartbeat_at else None,
            "registered_at": self.registered_at.isoformat() if self.registered_at else None,
            "total_tasks_completed": self.total_tasks_completed,
            "total_tasks_failed": self.total_tasks_failed,
        }
