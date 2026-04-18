import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from .models import Scene, PipelineConfig
from .client import VideoGenerationClient, AudioContentFilterError
from .downloader import Downloader
from .editor import VideoEditor
from .narration_agent import NarrationAgent


class VideoPipeline:
    """
    Async orchestrator for multi-scene video generation using Seedance 2.0.

    Optimisations:
    - Narration (TTS) for ALL scenes generated in parallel at the start
    - Async polling — no blocking sleeps
    - Seed image generation overlaps with first scene submission

    Each run saves all files into a timestamped subfolder:
      output/run_YYYYMMDD_HHMMSS/
        seed_image.jpg
        scene_01.mp4 ... scene_N.mp4
        narration_01.mp3 ... narration_N.mp3
        narrated_01.mp4 ... narrated_N.mp4
        final_video.mp4
        result.json
    """

    def __init__(self, api_key: str, config: PipelineConfig = None):
        self._config = config or PipelineConfig()
        self._client = VideoGenerationClient(api_key, self._config)
        self._downloader = Downloader()
        self._editor = VideoEditor()
        self._narrator = NarrationAgent()
        run_id = datetime.now().strftime("run_%Y%m%d_%H%M%S")
        self._output_dir = Path(self._config.output_dir) / run_id
        self.run_id = run_id

    def run(self, scenes: List[Scene]) -> Path:
        """Synchronous entry point — runs the async pipeline."""
        return asyncio.run(self._run_async(scenes))

    async def run_async(self, scenes: List[Scene]) -> Path:
        """Async entry point — use this when already inside an event loop."""
        return await self._run_async(scenes)

    async def _run_async(self, scenes: List[Scene]) -> Path:
        if not scenes:
            raise ValueError("At least one scene is required.")
        if not scenes[0].image_url:
            raise ValueError("The first scene must have an image_url.")

        self._output_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n{'='*60}")
        print(f"  Seedance 2.0 — Long Video Pipeline (async)")
        print(f"  Run     : {self.run_id}")
        print(f"  Folder  : {self._output_dir}")
        print(f"  {len(scenes)} scenes × {self._config.scene_duration}s "
              f"= ~{len(scenes) * self._config.scene_duration}s video")
        print(f"  Audio: {'on' if self._config.generate_audio else 'off'} | "
              f"Ratio: {self._config.ratio}")
        print(f"{'='*60}\n")

        # ── Kick off narration generation in parallel with video generation ──
        has_narration = any(s.narration.strip() for s in scenes)
        narration_task = None
        if has_narration:
            narration_task = asyncio.create_task(
                self._narrator.generate_all(scenes, self._output_dir)
            )

        # ── Generate scenes sequentially (each needs previous last frame) ──
        clip_paths = []
        last_frame_url: Optional[str] = None

        for i, scene in enumerate(scenes):
            clip_path, task_result = await self._process_scene(
                scene=scene,
                index=i,
                total=len(scenes),
                last_frame_url=last_frame_url,
            )
            clip_paths.append(clip_path)

            if i < len(scenes) - 1:
                last_frame_url = self._client.extract_last_frame_url(task_result)
                print(f"  Last frame captured for scene {i + 2}.")

        # ── Wait for narration to finish (likely already done) ──
        audio_paths = await narration_task if narration_task else [None] * len(scenes)

        # ── Merge narration into each clip ──
        final_clips = []
        for i, (clip, audio) in enumerate(zip(clip_paths, audio_paths)):
            if audio and audio.exists():
                narrated = self._output_dir / f"narrated_{i+1:02d}.mp4"
                print(f"  Merging narration → scene {i+1}")
                self._narrator.merge_narration(clip, audio, narrated)
                final_clips.append(narrated)
            else:
                final_clips.append(clip)

        # ── Concatenate all clips ──
        output_path = self._output_dir / self._config.output_filename
        print(f"\n── Concatenating {len(final_clips)} clips ──")
        self._editor.concatenate(final_clips, output_path)

        self._save_metadata(scenes, clip_paths, audio_paths, output_path)

        print(f"\n✓ Done!")
        print(f"  Video    : {output_path.resolve()}")
        print(f"  Duration : ~{len(scenes) * self._config.scene_duration}s\n")
        return output_path

    async def _process_scene(
        self,
        scene: Scene,
        index: int,
        total: int,
        last_frame_url: Optional[str],
    ):
        scene_num = index + 1
        is_last = index == total - 1

        print(f"── Scene {scene_num}/{total} ──────────────────────────────")
        print(f"  Prompt : {scene.prompt[:80]}{'...' if len(scene.prompt) > 80 else ''}")

        image_url = scene.image_url or last_frame_url
        source = "provided image" if scene.image_url else "last frame of previous scene"
        print(f"  Frame  : {source}")
        print(f"  Submitting task...")

        task_id = await self._client.submit_task(
            prompt=scene.prompt,
            image_url=image_url,
            return_last_frame=not is_last,
        )
        print(f"  Task ID: {task_id}")

        try:
            task_result = await self._client.wait_for_task(task_id)
        except AudioContentFilterError:
            print(f"  ⚠ Audio filter — retrying without audio...")
            task_id = await self._client.submit_task(
                prompt=scene.prompt,
                image_url=image_url,
                return_last_frame=not is_last,
                audio=False,
            )
            print(f"  Task ID: {task_id} (no audio)")
            task_result = await self._client.wait_for_task(task_id)

        video_url = task_result.content.video_url
        print(f"  Done!")

        clip_path = self._output_dir / f"scene_{scene_num:02d}.mp4"
        print(f"  Downloading → {clip_path}")
        self._downloader.download(video_url, clip_path)

        return clip_path, task_result

    def _save_metadata(
        self,
        scenes: List[Scene],
        clip_paths: List[Path],
        audio_paths: List[Optional[Path]],
        output_path: Path,
    ) -> None:
        payload = [{
            "output": str(output_path),
            "run_id": self.run_id,
            "total_scenes": len(scenes),
            "scene_duration": self._config.scene_duration,
            "ratio": self._config.ratio,
            "audio": self._config.generate_audio,
            "scenes": [
                {
                    "scene": i + 1,
                    "prompt": s.prompt,
                    "narration": s.narration,
                    "clip": str(clip_paths[i]),
                    "narration_audio": str(audio_paths[i]) if audio_paths[i] else None,
                }
                for i, s in enumerate(scenes)
            ],
        }]
        result_path = self._output_dir / "result.json"
        result_path.write_text(json.dumps(payload, indent=2))
        print(f"  Result   : {result_path}")
