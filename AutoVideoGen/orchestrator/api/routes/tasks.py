"""
Task Management API Routes
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...models.task import Task, TaskStatus
from ...services.task_queue import task_queue_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


class AcquireTaskRequest(BaseModel):
    worker_id: str


class AcquireTaskResponse(BaseModel):
    task_id: int
    video_id: int
    title: str
    script: str


class CompleteTaskRequest(BaseModel):
    worker_id: str
    output_path: str
    file_hash: Optional[str] = None


class FailTaskRequest(BaseModel):
    worker_id: str
    error_message: str
    retryable: bool = True


class SuccessResponse(BaseModel):
    success: bool


@router.post("/acquire", response_model=Optional[AcquireTaskResponse])
def acquire_task(request: AcquireTaskRequest, db: Session = Depends(get_db)):
    """Acquire a task exclusively for processing"""
    task = task_queue_service.acquire_task(db, request.worker_id)

    if not task:
        return None

    return AcquireTaskResponse(
        task_id=task.id,
        video_id=task.id,
        title=task.title or "",
        script=task.script or "",
    )


@router.put("/{task_id}/complete", response_model=SuccessResponse)
def complete_task(
    task_id: int,
    request: CompleteTaskRequest,
    db: Session = Depends(get_db),
):
    """Mark a task as completed"""
    success = task_queue_service.complete_task(
        db,
        task_id,
        request.worker_id,
        request.output_path,
        request.file_hash,
    )

    if not success:
        raise HTTPException(status_code=400, detail="Failed to complete task")

    return SuccessResponse(success=True)


@router.put("/{task_id}/fail", response_model=SuccessResponse)
def fail_task(
    task_id: int,
    request: FailTaskRequest,
    db: Session = Depends(get_db),
):
    """Mark a task as failed"""
    success = task_queue_service.fail_task(
        db,
        task_id,
        request.worker_id,
        request.error_message,
        request.retryable,
    )

    if not success:
        raise HTTPException(status_code=400, detail="Failed to fail task")

    return SuccessResponse(success=True)


@router.get("")
def list_tasks(
    status: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List all tasks"""
    query = db.query(Task)

    if status:
        query = query.filter(Task.status == status)

    tasks = query.order_by(Task.id.desc()).limit(limit).all()

    return [task.to_dict() for task in tasks]


@router.get("/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get a specific task"""
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task.to_dict()
