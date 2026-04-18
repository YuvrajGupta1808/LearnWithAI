import requests
from pathlib import Path


class Downloader:
    """Handles downloading remote files to local paths."""

    CHUNK_SIZE = 8192

    def download(self, url: str, dest: Path) -> Path:
        """Download a file from url and save to dest. Returns dest path."""
        dest.parent.mkdir(parents=True, exist_ok=True)
        response = requests.get(url, stream=True, timeout=60)
        response.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in response.iter_content(chunk_size=self.CHUNK_SIZE):
                f.write(chunk)
        return dest
