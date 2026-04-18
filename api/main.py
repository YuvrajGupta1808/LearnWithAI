"""
Seedance 2.0 — Teaching Video API

POST /generate   — submit a job (returns job_id immediately)
GET  /status/{job_id}  — poll job status
GET  /download/{job_id} — stream final_video.mp4 when done
"""

import asyncio
import uuid
from enum import Enum
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from seedance_pipeline import VideoPipeline, ScriptAgent, ImageGenerationClient, PipelineConfig
from seedance_pipeline.env import load_env

load_env()

app = FastAPI(
    title="Seedance Teaching Video API",
    description="Generate AI teaching videos for kids using Seedance 2.0",
    version="1.0.0",
)

# ── In-memory job store (replace with Redis/DB for production) ────────────────
class JobStatus(str, Enum):
    PENDING   = "pending"
    RUNNING   = "running"
    DONE      = "done"
    FAILED    = "failed"

class Job(BaseModel):
    job_id: str
    status: JobStatus = JobStatus.PENDING
    error: Optional[str] = None
    video_path: Optional[str] = None
    run_id: Optional[str] = None

_jobs: dict[str, Job] = {}


# ── Request / Response schemas ────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    brief: str = Field(
        ...,
        description="Creative brief describing the video content",
        example="A fun cartoon teacher explaining the solar system to kids",
    )
    num_scenes: int = Field(default=6, ge=2, le=10)
    scene_duration: int = Field(default=5, ge=4, le=15)
    ratio: str = Field(default="16:9")

class GenerateResponse(BaseModel):
    job_id: str
    status: JobStatus
    message: str

class StatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    run_id: Optional[str] = None
    error: Optional[str] = None
    download_url: Optional[str] = None


# ── Background pipeline task ──────────────────────────────────────────────────

async def _run_pipeline(job_id: str, req: GenerateRequest, api_key: str):
    job = _jobs[job_id]
    job.status = JobStatus.RUNNING

    try:
        config = PipelineConfig(
            scene_duration=req.scene_duration,
            ratio=req.ratio,
            generate_audio=True,
            output_dir="output",
            output_filename="final_video.mp4",
        )

        # Step 1 — Write script
        agent = ScriptAgent(api_key=api_key)
        _, scenes = agent.write_script(
            user_brief=req.brief,
            num_scenes=req.num_scenes,
            scene_duration=req.scene_duration,
        )

        # Step 2 — Create pipeline (establishes run folder)
        pipeline = VideoPipeline(api_key=api_key, config=config)
        job.run_id = pipeline.run_id

        # Step 3 — Generate seed image
        image_client = ImageGenerationClient(api_key=api_key)
        seed_image = await image_client.generate(
            prompt=scenes[0].prompt,
            output_path=pipeline._output_dir / "seed_image.jpg",
        )
        scenes[0].image_url = seed_image

        # Step 4 — Run pipeline
        video_path = await pipeline.run_async(scenes)

        job.video_path = str(video_path)
        job.status = JobStatus.DONE

    except Exception as e:
        job.status = JobStatus.FAILED
        job.error = str(e)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/generate", response_model=GenerateResponse, status_code=202)
async def generate(req: GenerateRequest, background_tasks: BackgroundTasks):
    """Submit a video generation job. Returns a job_id to poll for status."""
    import os
    api_key = os.environ.get("ARK_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="ARK_API_KEY not configured")

    job_id = str(uuid.uuid4())
    _jobs[job_id] = Job(job_id=job_id)
    background_tasks.add_task(_run_pipeline, job_id, req, api_key)

    return GenerateResponse(
        job_id=job_id,
        status=JobStatus.PENDING,
        message=f"Job submitted. Poll /status/{job_id} for updates.",
    )


@app.get("/status/{job_id}", response_model=StatusResponse)
async def status(job_id: str):
    """Poll job status. When done, a download_url is provided."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    download_url = f"/download/{job_id}" if job.status == JobStatus.DONE else None
    return StatusResponse(
        job_id=job_id,
        status=job.status,
        run_id=job.run_id,
        error=job.error,
        download_url=download_url,
    )


@app.get("/download/{job_id}")
async def download(job_id: str):
    """Stream the final video file when the job is complete."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != JobStatus.DONE:
        raise HTTPException(status_code=425, detail=f"Job not ready — status: {job.status}")
    if not job.video_path or not Path(job.video_path).exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    return FileResponse(
        path=job.video_path,
        media_type="video/mp4",
        filename=f"teaching_video_{job.run_id}.mp4",
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
