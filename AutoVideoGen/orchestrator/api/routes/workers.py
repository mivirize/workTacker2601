"""
Worker Management API Routes
"""
from datetime import datetime
from typing import Optional
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...models.worker import Worker, WorkerStatus

router = APIRouter(prefix="/workers", tags=["workers"])


class RegisterWorkerRequest(BaseModel):
    hostname: str
    ip_address: str


class RegisterWorkerResponse(BaseModel):
    worker_id: str
    message: str


class HeartbeatRequest(BaseModel):
    status: str
    current_task_id: Optional[int] = None


class HeartbeatResponse(BaseModel):
    ack: bool
    commands: list = []


@router.post("/register", response_model=RegisterWorkerResponse)
def register_worker(request: RegisterWorkerRequest, db: Session = Depends(get_db)):
    """Register a new worker"""
    worker_id = str(uuid4())

    worker = Worker(
        id=worker_id,
        hostname=request.hostname,
        ip_address=request.ip_address,
        status=WorkerStatus.IDLE.value,
        last_heartbeat_at=datetime.utcnow(),
    )

    db.add(worker)
    db.commit()

    return RegisterWorkerResponse(
        worker_id=worker_id,
        message="Worker registered successfully",
    )


@router.post("/{worker_id}/heartbeat", response_model=HeartbeatResponse)
def worker_heartbeat(
    worker_id: str,
    request: HeartbeatRequest,
    db: Session = Depends(get_db),
):
    """Process worker heartbeat"""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()

    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    worker.status = request.status
    worker.current_task_id = request.current_task_id
    worker.last_heartbeat_at = datetime.utcnow()

    db.commit()

    return HeartbeatResponse(ack=True, commands=[])


@router.get("")
def list_workers(db: Session = Depends(get_db)):
    """List all registered workers"""
    workers = db.query(Worker).all()
    return [worker.to_dict() for worker in workers]


@router.get("/{worker_id}")
def get_worker(worker_id: str, db: Session = Depends(get_db)):
    """Get a specific worker"""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()

    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    return worker.to_dict()


@router.delete("/{worker_id}")
def delete_worker(worker_id: str, db: Session = Depends(get_db)):
    """Remove a worker"""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()

    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    db.delete(worker)
    db.commit()

    return {"success": True, "message": "Worker removed"}
