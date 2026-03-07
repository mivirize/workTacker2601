"""
Task Queue Service with Exclusive Locking
"""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..models.task import Task, TaskStatus
from ..core.config import settings


class TaskQueueService:
    """Manages task acquisition with exclusive locking"""

    def acquire_task(self, db: Session, worker_id: str, max_attempts: int = 3) -> Optional[Task]:
        """
        Acquire a task exclusively for a worker.
        Uses optimistic locking to prevent race conditions.
        """
        import time

        for attempt in range(max_attempts):
            # Find the next available task
            task = (
                db.query(Task)
                .filter(Task.status == TaskStatus.PLANNED.value)
                .filter(Task.retry_count < Task.max_retries)
                .order_by(Task.id)
                .first()
            )

            if not task:
                return None

            # Optimistic lock: update only if lock_version matches
            expected_version = task.lock_version
            try:
                result = db.execute(
                    text("""
                        UPDATE videos
                        SET status = :status,
                            assigned_worker_id = :worker_id,
                            assigned_at = :assigned_at,
                            lock_version = lock_version + 1
                        WHERE id = :id AND lock_version = :expected_version
                    """),
                    {
                        "status": TaskStatus.PROCESSING.value,
                        "worker_id": worker_id,
                        "assigned_at": datetime.utcnow(),
                        "id": task.id,
                        "expected_version": expected_version,
                    },
                )
                db.commit()

                if result.rowcount > 0:
                    db.refresh(task)
                    return task

                # Another worker got the task, retry with backoff
                if attempt < max_attempts - 1:
                    time.sleep(0.1 * (2 ** attempt))

            except Exception as e:
                db.rollback()
                raise

        return None

    def complete_task(
        self,
        db: Session,
        task_id: int,
        worker_id: str,
        output_path: str,
        file_hash: Optional[str] = None,
    ) -> bool:
        """Mark a task as completed"""
        task = db.query(Task).filter(Task.id == task_id).first()

        if not task:
            return False

        if task.assigned_worker_id != worker_id:
            return False

        task.status = TaskStatus.DOWNLOADED.value
        task.file_path = output_path
        task.completed_at = datetime.utcnow()
        task.assigned_worker_id = None
        task.lock_version += 1

        db.commit()
        return True

    def fail_task(
        self,
        db: Session,
        task_id: int,
        worker_id: str,
        error_message: str,
        retryable: bool = True,
    ) -> bool:
        """Mark a task as failed, optionally queue for retry"""
        task = db.query(Task).filter(Task.id == task_id).first()

        if not task:
            return False

        if task.assigned_worker_id != worker_id:
            return False

        task.error_message = error_message
        task.retry_count += 1
        task.assigned_worker_id = None
        task.assigned_at = None
        task.lock_version += 1

        if retryable and task.retry_count < task.max_retries:
            # Queue for retry
            task.status = TaskStatus.PLANNED.value
        else:
            # Max retries reached or not retryable
            task.status = TaskStatus.FAILED.value

        db.commit()
        return True

    def recover_stale_tasks(self, db: Session) -> int:
        """
        Recover tasks stuck in processing state
        (worker died without reporting)
        """
        stale_threshold = datetime.utcnow()
        timeout_seconds = settings.stale_task_timeout_seconds

        result = db.execute(
            text("""
                UPDATE videos
                SET status = :planned_status,
                    assigned_worker_id = NULL,
                    assigned_at = NULL,
                    retry_count = retry_count + 1,
                    error_message = 'Recovered from stale state',
                    lock_version = lock_version + 1
                WHERE status = :processing_status
                  AND assigned_at < datetime('now', :timeout)
                  AND retry_count < max_retries
            """),
            {
                "planned_status": TaskStatus.PLANNED.value,
                "processing_status": TaskStatus.PROCESSING.value,
                "timeout": f"-{timeout_seconds} seconds",
            },
        )
        db.commit()

        return result.rowcount

    def get_stats(self, db: Session) -> dict:
        """Get task queue statistics"""
        planned = db.query(Task).filter(Task.status == TaskStatus.PLANNED.value).count()
        processing = db.query(Task).filter(Task.status == TaskStatus.PROCESSING.value).count()
        downloaded = db.query(Task).filter(Task.status == TaskStatus.DOWNLOADED.value).count()
        failed = db.query(Task).filter(Task.status == TaskStatus.FAILED.value).count()

        return {
            "planned": planned,
            "processing": processing,
            "downloaded": downloaded,
            "failed": failed,
            "total": planned + processing + downloaded + failed,
        }


task_queue_service = TaskQueueService()
