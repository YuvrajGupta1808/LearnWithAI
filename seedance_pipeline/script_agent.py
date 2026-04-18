import json
from byteplussdkarkruntime import Ark
from .models import Scene


SYSTEM_PROMPT = """You are an award-winning film director and screenwriter specialising
in AI video generation. Your scripts are used directly as prompts for Seedance 2.0,
a state-of-the-art video generation model.

Your job: analyse the user's creative brief, then write a detailed, cinematic,
scene-by-scene video script WITH matching narration for each scene.

## What makes a great Seedance prompt

Each scene prompt MUST include ALL of the following elements:

1. SUBJECT & ACTION — who/what is in the scene and exactly what they are doing
   e.g. "A weathered astronaut slowly raises their visor, eyes wide with disbelief"

2. CAMERA — shot type and movement
   e.g. "extreme close-up", "slow dolly push-in", "sweeping aerial crane shot",
   "handheld shaky cam", "static wide shot", "tracking shot from behind"

3. ENVIRONMENT & SETTING — location, time of day, weather, atmosphere
   e.g. "barren red Martian plateau at golden hour, dust devils in the distance"

4. LIGHTING — quality, direction, colour temperature
   e.g. "harsh side-lighting casting long shadows", "soft diffused blue moonlight",
   "warm practical torch light flickering on stone walls"

5. MOOD & TONE — emotional register
   e.g. "tense and claustrophobic", "awe-inspiring and epic", "melancholic and quiet"

6. VISUAL STYLE — cinematic reference
   e.g. "IMAX 70mm film grain", "shallow depth of field", "anamorphic lens flares",
   "hyper-realistic", "painterly", "noir high-contrast"

7. MOTION & PHYSICS — how things move in the scene
   e.g. "dust particles float in slow motion", "fabric ripples in the wind",
   "water droplets scatter in zero gravity"

## Narration rules
- Each scene must have a short narration (2–4 sentences, ~15–25 words)
- Written for the target audience — match the tone of the brief
- Should be read aloud in ~4–5 seconds (matching scene duration)
- No stage directions, no character names — pure spoken words only

## Continuity rules
- Each scene must flow visually and narratively from the previous one
- Maintain consistent subject appearance, lighting direction, and colour palette

## Output rules
- Output ONLY valid JSON — no markdown fences, no explanation, no extra text
- Each prompt should be 60–120 words — detailed but focused

Output format:
{
  "title": "short evocative video title",
  "style": "overall visual style summary",
  "scenes": [
    {
      "scene": 1,
      "prompt": "full detailed cinematic prompt",
      "narration": "spoken narration text for this scene"
    }
  ]
}"""


class ScriptAgent:
    """
    Uses the Seed-2.0 Chat API to analyse a reference image + user brief
    and generate a structured multi-scene video script.
    """

    def __init__(self, api_key: str, model: str = "seed-2-0-pro-260328"):
        self._client = Ark(api_key=api_key)
        self._model = model

    def write_script(
        self,
        user_brief: str,
        num_scenes: int = 6,
        scene_duration: int = 5,
    ) -> tuple[str, list[Scene]]:
        """
        Write a multi-scene video script from a text brief alone.
        Returns (title, list of Scene objects) — no image_url needed here.
        The caller is responsible for setting scene[0].image_url before
        passing scenes to VideoPipeline.
        """
        print(f"\n── ScriptAgent ─────────────────────────────────────")
        print(f"  Model  : {self._model}")
        print(f"  Scenes : {num_scenes} × {scene_duration}s")
        print(f"  Brief  : {user_brief[:100]}{'...' if len(user_brief) > 100 else ''}")
        print(f"  Writing script...")

        user_message = {
            "role": "user",
            "content": (
                f"## Creative Brief\n"
                f"{user_brief.strip()}\n\n"
                f"## Requirements\n"
                f"- Write exactly {num_scenes} scenes\n"
                f"- Each scene is {scene_duration} seconds long "
                f"(~{scene_duration * 24} frames at 24fps)\n"
                f"- Total video: ~{num_scenes * scene_duration} seconds\n"
                f"- Each prompt must include: subject+action, camera, "
                f"environment, lighting, mood, visual style, and motion\n"
                f"- Maintain visual and narrative continuity across all scenes"
            ),
        }

        response = self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                user_message,
            ],
            max_tokens=4096,
        )

        raw = response.choices[0].message.content.strip()

        # Strip markdown code fences if model wraps in ```json ... ```
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        script = json.loads(raw)
        title = script.get("title", "Untitled")
        style = script.get("style", "")
        scenes_data = script["scenes"]

        # image_url is NOT set here — caller sets it on scene[0]
        scenes = [Scene(prompt=s["prompt"], narration=s.get("narration", "")) for s in scenes_data]

        print(f"  Title  : {title}")
        if style:
            print(f"  Style  : {style}")
        for i, scene in enumerate(scenes):
            print(f"  Scene {i+1}: {scene.prompt[:60]}...")
            print(f"    Narration: {scene.narration}")
        print(f"────────────────────────────────────────────────────\n")

        return title, scenes
