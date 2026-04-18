from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Scene:
    """Represents a single scene in the video pipeline."""
    prompt: str
    image_url: Optional[str] = None   # first scene needs one; rest use last frame
    narration: str = ""               # spoken narration text for TTS


@dataclass
class PipelineConfig:
    """Configuration for the video generation pipeline."""
    model_id: str = "dreamina-seedance-2-0-fast-260128"
    scene_duration: int = 5          # seconds per scene (4–15)
    ratio: str = "16:9"
    generate_audio: bool = True
    watermark: bool = False
    poll_interval: int = 30          # seconds between status checks
    output_dir: str = "output"
    output_filename: str = "final_video.mp4"
