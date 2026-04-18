"""
Unit test for ScriptAgent — writes a script for 'Kids learning about the solar system'
Runs against the real seed-2-0-pro API (integration test).

Run with:
    .venv/bin/python -m pytest tests/test_script_agent.py -v -s
"""

import json
import unittest
from pathlib import Path

from seedance_pipeline.env import get_api_key
from seedance_pipeline.script_agent import ScriptAgent
from seedance_pipeline.models import Scene

# No image URL needed — ScriptAgent works from text brief only
TEST_BRIEF = """
An engaging, colourful educational video for children aged 5–10 about the solar system.
Each scene should introduce a different planet or space concept in a fun, 
wonder-filled way. Style: vibrant, animated-feel, friendly and exciting.
Narration-friendly visuals — each scene should feel like a page from a 
beautiful children's space book come to life.
"""

NUM_SCENES = 6
SCENE_DURATION = 5


class TestScriptAgent(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.api_key = get_api_key()
        cls.agent = ScriptAgent(api_key=cls.api_key)
        # Call the API once — all tests share this result
        cls.title, cls.scenes = cls.agent.write_script(
            user_brief=TEST_BRIEF,
            num_scenes=NUM_SCENES,
            scene_duration=SCENE_DURATION,
        )

        # ── Print the full script to stdout ──────────────────────────
        print(f"\n{'='*60}")
        print(f"  GENERATED SCRIPT: {cls.title}")
        print(f"{'='*60}")
        for i, scene in enumerate(cls.scenes):
            print(f"\nScene {i+1}:")
            print(f"  {scene.prompt}")
        print(f"\n{'='*60}\n")

        # ── Save to file matching the pipeline's final_video.json schema ──
        out_path = Path("tests/test_output_script.json")
        out_path.write_text(json.dumps([{
            "output": "output/final_video.mp4",
            "total_scenes": NUM_SCENES,
            "scene_duration": SCENE_DURATION,
            "ratio": "16:9",
            "audio": True,
            "scenes": [
                {
                    "scene": i + 1,
                    "prompt": s.prompt,
                    "clip": f"output/scene_{i+1:02d}.mp4",
                }
                for i, s in enumerate(cls.scenes)
            ]
        }], indent=2))
        print(f"  Script saved to: {out_path}\n")

    def test_returns_correct_number_of_scenes(self):
        """Agent must return exactly NUM_SCENES Scene objects."""
        self.assertEqual(len(self.scenes), NUM_SCENES)

    def test_all_scenes_are_scene_objects(self):
        """Every item in the returned list must be a Scene instance."""
        for scene in self.scenes:
            self.assertIsInstance(scene, Scene)

    def test_scenes_have_no_image_url(self):
        """ScriptAgent must NOT set image_url — that's the caller's job."""
        for i, scene in enumerate(self.scenes):
            self.assertIsNone(scene.image_url, f"Scene {i+1} should not have image_url set")

    def test_all_prompts_are_non_empty_strings(self):
        """Every scene prompt must be a non-empty string."""
        for i, scene in enumerate(self.scenes):
            self.assertIsInstance(scene.prompt, str, f"Scene {i+1} prompt is not a string")
            self.assertGreater(len(scene.prompt.strip()), 20, f"Scene {i+1} prompt is too short")

    def test_prompts_are_detailed_enough(self):
        """Each prompt should be at least 40 words (cinematic detail check)."""
        for i, scene in enumerate(self.scenes):
            word_count = len(scene.prompt.split())
            self.assertGreaterEqual(
                word_count, 40,
                f"Scene {i+1} prompt only has {word_count} words — needs more cinematic detail"
            )

    def test_title_is_returned(self):
        """Agent must return a non-empty title string."""
        self.assertIsInstance(self.title, str)
        self.assertGreater(len(self.title.strip()), 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
