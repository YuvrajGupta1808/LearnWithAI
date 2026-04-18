import subprocess
import tempfile
import os
from pathlib import Path
from typing import List


class VideoEditor:
    """Handles video concatenation using ffmpeg."""

    def concatenate(self, clip_paths: List[Path], output_path: Path) -> Path:
        """Concatenate multiple video clips (with audio) into one output file."""
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
            for path in clip_paths:
                f.write(f"file '{path.resolve()}'\n")
            concat_file = f.name

        try:
            result = subprocess.run(
                [
                    "ffmpeg", "-y",
                    "-f", "concat", "-safe", "0",
                    "-i", concat_file,
                    "-c:v", "copy",
                    "-c:a", "aac", "-b:a", "192k",
                    str(output_path),
                ],
                check=True,
                capture_output=True,
            )
        except subprocess.CalledProcessError as e:
            raise RuntimeError(
                f"ffmpeg failed:\n{e.stderr.decode()}"
            ) from e
        finally:
            os.unlink(concat_file)

        return output_path
