"""
Batch Processing Engine
Processes multiple customers in parallel using asyncio.
Simulates how SBI would run LifePulse nightly on their full customer base.
In production: replace with Celery + Redis or AWS SQS.
"""

import asyncio
import time
from typing import Any, Callable
from dataclasses import dataclass, field
from enum import Enum


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class CustomerJob:
    customer_id: str
    customer_name: str
    status: JobStatus = JobStatus.QUEUED
    result: dict = field(default_factory=dict)
    error: str = ""
    started_at: float = 0.0
    finished_at: float = 0.0

    @property
    def duration_ms(self) -> int:
        if self.started_at and self.finished_at:
            return int((self.finished_at - self.started_at) * 1000)
        return 0


@dataclass
class BatchRun:
    run_id: str
    total: int
    jobs: list[CustomerJob] = field(default_factory=list)
    started_at: float = field(default_factory=time.time)
    finished_at: float = 0.0
    concurrency: int = 3

    @property
    def done(self) -> int:
        return sum(1 for j in self.jobs if j.status in (JobStatus.DONE, JobStatus.FAILED, JobStatus.SKIPPED))

    @property
    def successful(self) -> int:
        return sum(1 for j in self.jobs if j.status == JobStatus.DONE)

    @property
    def failed(self) -> int:
        return sum(1 for j in self.jobs if j.status == JobStatus.FAILED)

    @property
    def progress_pct(self) -> float:
        return round((self.done / self.total) * 100, 1) if self.total else 0

    @property
    def is_complete(self) -> bool:
        return self.done >= self.total

    @property
    def elapsed_seconds(self) -> float:
        end = self.finished_at or time.time()
        return round(end - self.started_at, 2)

    def to_dict(self) -> dict:
        return {
            "run_id": self.run_id,
            "total": self.total,
            "done": self.done,
            "successful": self.successful,
            "failed": self.failed,
            "progress_pct": self.progress_pct,
            "is_complete": self.is_complete,
            "elapsed_seconds": self.elapsed_seconds,
            "concurrency": self.concurrency,
            "jobs": [
                {
                    "customer_id": j.customer_id,
                    "customer_name": j.customer_name,
                    "status": j.status,
                    "result": j.result,
                    "error": j.error,
                    "duration_ms": j.duration_ms,
                }
                for j in self.jobs
            ],
        }


# In-memory store of batch runs
_batch_runs: dict[str, BatchRun] = {}


def get_run(run_id: str) -> BatchRun | None:
    return _batch_runs.get(run_id)


def all_runs() -> list[dict]:
    return [r.to_dict() for r in _batch_runs.values()]


async def run_batch(
    run_id: str,
    customers: list[dict[str, Any]],
    process_fn: Callable,
    concurrency: int = 3,
    on_job_done: Callable | None = None,
) -> BatchRun:
    """
    Process a list of customers concurrently.

    process_fn: async function(customer) -> dict with keys:
        top_event, confidence, recommended_product, whatsapp_message
    on_job_done: optional async callback(job) called after each customer finishes
    """
    batch = BatchRun(
        run_id=run_id,
        total=len(customers),
        concurrency=concurrency,
        jobs=[CustomerJob(customer_id=c["id"], customer_name=c["name"]) for c in customers],
    )
    _batch_runs[run_id] = batch

    semaphore = asyncio.Semaphore(concurrency)

    async def process_one(job: CustomerJob, customer: dict):
        async with semaphore:
            job.status = JobStatus.RUNNING
            job.started_at = time.time()
            try:
                result = await process_fn(customer)
                job.result = result
                job.status = JobStatus.DONE
            except Exception as e:
                job.error = str(e)
                job.status = JobStatus.FAILED
            finally:
                job.finished_at = time.time()
                if on_job_done:
                    await on_job_done(job)

    tasks = [
        asyncio.create_task(process_one(job, customer))
        for job, customer in zip(batch.jobs, customers)
    ]
    await asyncio.gather(*tasks)
    batch.finished_at = time.time()
    return batch
