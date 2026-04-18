"""
Seedance 2.0 — Dynamic Long Video Pipeline (async)

Flow:
  1. ScriptAgent           — writes scene prompts + narration from your brief
  2. ImageGenerationClient — generates seed image from scene 1 prompt
  3. VideoPipeline (async) — generates scenes, narration in parallel, concatenates

Usage:
    python run_pipeline.py
"""

import asyncio
from seedance_pipeline import VideoPipeline, ScriptAgent, ImageGenerationClient, PipelineConfig
from seedance_pipeline.env import get_api_key


# ── User Input ────────────────────────────────────────────────────────────────

USER_BRIEF = """
A fun, colourful cartoon video of an enthusiastic teacher explaining the solar
system to a classroom full of excited kids. The teacher uses a big glowing
holographic display showing each planet. Each scene introduces a new planet
with the kids reacting with wonder and joy. Style: vibrant 3D cartoon animation,
Pixar-inspired, warm classroom lighting, friendly and educational tone.
Characters are expressive and full of personality. End with all the kids and
the teacher cheering together in front of the full solar system display.
"""

# ── Config ────────────────────────────────────────────────────────────────────

NUM_SCENES = 6
SCENE_DURATION = 5

CONFIG = PipelineConfig(
    scene_duration=SCENE_DURATION,
    ratio="16:9",
    generate_audio=True,
    output_dir="output",
    output_filename="final_video.mp4",
)

# ── Run ───────────────────────────────────────────────────────────────────────

async def main():
    api_key = get_api_key()

    # Step 1 — ScriptAgent writes script + narration from brief
    agent = ScriptAgent(api_key=api_key)
    title, scenes = agent.write_script(
        user_brief=USER_BRIEF,
        num_scenes=NUM_SCENES,
        scene_duration=SCENE_DURATION,
    )

    # Step 2 — Create pipeline first (establishes run folder)
    pipeline = VideoPipeline(api_key=api_key, config=CONFIG)

    # Step 3 — Generate seed image async, save into run folder
    image_client = ImageGenerationClient(api_key=api_key)
    seed_image = await image_client.generate(
        prompt=scenes[0].prompt,
        output_path=pipeline._output_dir / "seed_image.jpg",
    )
    scenes[0].image_url = seed_image

    # Step 4 — Run async pipeline
    await pipeline.run_async(scenes)


if __name__ == "__main__":
    asyncio.run(main())
