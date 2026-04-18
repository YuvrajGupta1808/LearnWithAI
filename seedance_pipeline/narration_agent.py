import asyncio
import subprocess
from pathlib import Path
from typing import List, Optional

import edge_tts

from .models import Scene

DEFAULT_VOICE = "en-US-AnaNeural"   # Cartoon, Cute — perfect for kids content


class NarrationAgent:
    """
    Converts per-scene narration text → MP3 files using edge-tts (async, parallel).
    Then merges each narration MP3 with its video clip via ffmpeg.
    """

    def __init__(self, voice: str = DEFAULT_VOICE, rate: str = "+0%", volume: str = "+0%"):
        self._voice = voice
        self._rate = rate
        self._volume = volume

    async def generate_all(self, scenes: List[Scene], output_dir: Path) -> List[Optional[Path]]:
        """Generate all narration MP3s in parallel. Returns list of audio paths."""
        output_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n── NarrationAgent ───────────────────────────────────")
        print(f"  Voice  : {self._voice}")
        print(f"  Generating {len(scenes)} narration tracks in parallel...")

        tasks = []
        paths = []
        for i, scene in enumerate(scenes):
            scene_num = i + 1
            if not scene.narration.strip():
                paths.append(None)
                tasks.append(None)
                continue
            audio_path = output_dir / f"narration_{scene_num:02d}.mp3"
            paths.append(audio_path)
            tasks.append(self._synthesise(scene.narration, audio_path))

        # Run all TTS calls concurrently
        await asyncio.gather(*[t for t in tasks if t is not None])

        for i, path in enumerate(paths):
            if path:
                print(f"  Scene {i+1}: {path.name} ✓")
        print(f"────────────────────────────────────────────────────\n")
        return paths

    async def _synthesise(self, text: str, output_path: Path) -> None:
        communicate = edge_tts.Communicate(
            text=text,
            voice=self._voice,
            rate=self._rate,
            volume=self._volume,
        )
        await communicate.save(str(output_path))

    def merge_narration(self, video_path: Path, audio_path: Path, output_path: Path) -> Path:
        """Merge narration audio into video. Handles clips with or without existing audio."""
        # Probe whether the video has an audio stream
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "a",
             "-show_entries", "stream=codec_type", "-of", "csv=p=0", str(video_path)],
            capture_output=True, text=True,
        )
        has_audio = "audio" in probe.stdout

        if has_audio:
            # Mix: narration 100% + original video audio 20%
            filter_complex = (
                "[0:a]volume=0.2[va];[1:a]volume=1.0[na];"
                "[va][na]amix=inputs=2:duration=first[aout]"
            )
            audio_map = "[aout]"
        else:
            # No original audio — just use narration directly
            filter_complex = "[1:a]volume=1.0[aout]"
            audio_map = "[aout]"

        subprocess.run(
            [
                "ffmpeg", "-y",
                "-i", str(video_path),
                "-i", str(audio_path),
                "-filter_complex", filter_complex,
                "-map", "0:v",
                "-map", audio_map,
                "-c:v", "copy",
                "-c:a", "aac", "-b:a", "192k",
                "-shortest",
                str(output_path),
            ],
            check=True,
            capture_output=True,
        )
        return output_path
