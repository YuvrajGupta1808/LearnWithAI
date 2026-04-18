import asyncio
from byteplussdkarkruntime import AsyncArk
from .models import PipelineConfig


class AudioContentFilterError(Exception):
    """Raised when a task fails due to audio content moderation."""
    pass


class VideoGenerationClient:
    """Wraps the Ark AsyncSDK for video generation task management."""

    def __init__(self, api_key: str, config: PipelineConfig):
        self._client = AsyncArk(api_key=api_key)
        self._config = config

    async def submit_task(self, prompt: str, image_url: str, return_last_frame: bool, audio: bool = None) -> str:
        """Submit a video generation task and return the task ID."""
        content = [{"type": "text", "text": prompt}]
        if image_url:
            content.append({
                "type": "image_url",
                "image_url": {"url": image_url},
                "role": "first_frame",
            })
        result = await self._client.content_generation.tasks.create(
            model=self._config.model_id,
            content=content,
            generate_audio=self._config.generate_audio if audio is None else audio,
            ratio=self._config.ratio,
            duration=self._config.scene_duration,
            watermark=self._config.watermark,
            return_last_frame=return_last_frame,
        )
        return result.id

    async def wait_for_task(self, task_id: str):
        """Async poll until task succeeds or fails."""
        while True:
            result = await self._client.content_generation.tasks.get(task_id=task_id)
            status = result.status
            if status == "succeeded":
                return result
            elif status == "failed":
                error = result.error
                if hasattr(error, "code") and "Audio" in str(error.code):
                    raise AudioContentFilterError(
                        f"Task {task_id} failed due to audio content filter: {error}"
                    )
                raise RuntimeError(f"Task {task_id} failed: {error}")
            print(f"    [{task_id}] {status} — retrying in {self._config.poll_interval}s...")
            await asyncio.sleep(self._config.poll_interval)

    @staticmethod
    def extract_last_frame_url(task_result) -> str:
        content = task_result.content
        for attr in ("last_frame_image_url", "last_frame_url", "lastFrameImageUrl"):
            val = getattr(content, attr, None) or (
                content.__dict__.get(attr) if hasattr(content, "__dict__") else None
            )
            if val:
                return val
        raise RuntimeError(
            "last_frame_image_url not found in task result. "
            "Ensure return_last_frame=True was set."
        )
