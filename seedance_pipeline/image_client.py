import base64
import asyncio
import httpx
from pathlib import Path
from byteplussdkarkruntime import AsyncArk


class ImageGenerationClient:
    """Generates a seed image from a text prompt using Seedream 5.0 (async)."""

    def __init__(self, api_key: str, model: str = "seedream-5-0-260128"):
        self._client = AsyncArk(api_key=api_key)
        self._model = model

    async def generate(self, prompt: str, output_path: Path, size: str = "2K") -> str:
        """Generate image, save locally, return base64 data URI."""
        print(f"\n── ImageGenerationClient ────────────────────────────")
        print(f"  Model  : {self._model}")
        print(f"  Prompt : {prompt[:80]}...")
        print(f"  Generating seed image...")

        response = await self._client.images.generate(
            model=self._model,
            prompt=prompt,
            size=size,
            watermark=False,
            response_format="url",
        )

        image_url = response.data[0].url
        print(f"  Done! Downloading seed image...")

        output_path.parent.mkdir(parents=True, exist_ok=True)
        async with httpx.AsyncClient() as client:
            r = await client.get(image_url, timeout=60)
            r.raise_for_status()
            img_bytes = r.content

        output_path.write_bytes(img_bytes)
        print(f"  Saved  : {output_path}")
        print(f"────────────────────────────────────────────────────\n")

        ext = output_path.suffix.lstrip(".")
        return f"data:image/{ext};base64,{base64.b64encode(img_bytes).decode()}"
