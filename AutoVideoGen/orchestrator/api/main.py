"""
AutoVideoGen Orchestrator API
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler

from .routes import tasks, workers
from ..core.database import engine, get_db_context
from ..models.task import Base as TaskBase
from ..models.worker import Base as WorkerBase
from ..services.task_queue import task_queue_service


def recover_stale_tasks_job():
    """Background job to recover stale tasks"""
    with get_db_context() as db:
        recovered = task_queue_service.recover_stale_tasks(db)
        if recovered > 0:
            print(f"[Scheduler] Recovered {recovered} stale tasks")


scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    # Startup
    print("[Orchestrator] Starting up...")

    # Create tables if they don't exist
    TaskBase.metadata.create_all(bind=engine)
    WorkerBase.metadata.create_all(bind=engine)

    # Start background scheduler
    scheduler.add_job(
        recover_stale_tasks_job,
        "interval",
        seconds=60,
        id="recover_stale_tasks",
    )
    scheduler.start()
    print("[Orchestrator] Background scheduler started")

    yield

    # Shutdown
    print("[Orchestrator] Shutting down...")
    scheduler.shutdown()


app = FastAPI(
    title="AutoVideoGen Orchestrator",
    description="Task orchestration API for parallel video generation",
    version="1.0.0",
    lifespan=lifespan,
)


# Include routers
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(workers.router, prefix="/api/v1")


@app.get("/api/v1/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/api/v1/stats")
def get_stats():
    """Get task queue statistics"""
    with get_db_context() as db:
        stats = task_queue_service.get_stats(db)
        return stats


if __name__ == "__main__":
    import uvicorn
    from ..core.config import settings

    uvicorn.run(
        "orchestrator.api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
    )
