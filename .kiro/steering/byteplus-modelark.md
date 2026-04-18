# BytePlus ModelArk — API Reference Skill

This skill gives Kiro full knowledge of the BytePlus ModelArk platform APIs.
Always refer to this when building features using any ModelArk capability.

Base URL: `https://ark.ap-southeast.bytepluses.com/api/v3`
Auth: All APIs use `Authorization: Bearer $ARK_API_KEY` header.
SDK: `byteplussdkarkruntime` (Python) — already installed in `.venv`.

---

## 1. VIDEO GENERATION API

**Endpoint:** `POST /contents/generations/tasks` (async — returns task ID)
**Docs:** https://docs.byteplus.com/en/docs/ModelArk/1520757

### Models

| Model ID | Key Capabilities |
|---|---|
| `dreamina-seedance-2-0-260128` | Multimodal ref-to-video, video edit, video extend, i2v first+last frame, t2v, audio sync |
| `dreamina-seedance-2-0-fast-260128` | Same as above, faster |
| `seedance-1-5-pro-251215` | i2v first+last frame, t2v, audio sync, draft mode |
| `seedance-1-0-pro-250528` | i2v first+last frame, t2v |
| `seedance-1-0-pro-fast-251015` | i2v first frame, t2v |

### Input `content[]` — Supported Combinations (Seedance 2.0)

- Text only → text-to-video
- Text + image (`role: first_frame`) → image-to-video
- Text + 2 images (`role: first_frame` + `role: last_frame`) → first & last frame
- Text + 1–9 images (`role: reference_image`) → multimodal reference video
- Text + video (`role: reference_video`) → video editing/extension
- Text + image + video + audio → full multimodal
- Audio CANNOT be input alone — needs at least one image or video

### Key Request Parameters

```python
client.content_generation.tasks.create(
    model="dreamina-seedance-2-0-260128",
    content=[
        {"type": "text", "text": "your prompt"},
        {"type": "image_url", "image_url": {"url": "..."}, "role": "first_frame"},
        {"type": "video_url", "video_url": {"url": "..."}, "role": "reference_video"},
        {"type": "audio_url", "audio_url": {"url": "..."}, "role": "reference_audio"},
    ],
    generate_audio=True,       # AI-synced audio (Seedance 2.0 + 1.5 pro only)
    ratio="16:9",              # 16:9 | 4:3 | 1:1 | 3:4 | 9:16 | 21:9 | adaptive
    duration=5,                # 4–15s (Seedance 2.0), or -1 for auto
    resolution="720p",         # 480p | 720p | 1080p
    watermark=False,
    return_last_frame=True,    # returns last frame image URL — use for chaining scenes
    seed=-1,                   # -1 = random
)
```

### Polling for Result

```python
result = client.content_generation.tasks.get(task_id=task_id)
# result.status: "queued" | "running" | "succeeded" | "failed" | "expired"
# result.content.video_url       — download URL (valid 24h)
# result.content.last_frame_image_url — if return_last_frame=True
```

### Long Video Pipeline Pattern (scene chaining)

Use `return_last_frame=True` — feed `last_frame_image_url` as `first_frame` of next scene.
This project's implementation: `seedance_pipeline/` package, entry: `run_pipeline.py`.

### Content Limits (Seedance 2.0)

- Images: up to 9 reference images, each < 30MB, formats: jpeg/png/webp/bmp/tiff/gif
- Videos: up to 3 reference videos, each 2–15s, total ≤ 15s, < 50MB, mp4/mov
- Audio: up to 3 clips, each 2–15s, total ≤ 15s, < 15MB, wav/mp3
- No real human faces in reference images/videos (platform restriction)

### Rate Limits (Seedance 2.0, default tier)

- Enterprise: 600 RPM, 10 concurrent
- Individual: 180 RPM, 3 concurrent

---

## 2. IMAGE GENERATION API

**Endpoint:** `POST /images/generations` (synchronous)
**Docs:** https://docs.byteplus.com/en/docs/ModelArk/1541523

### Models

| Model ID | Capabilities |
|---|---|
| `seedream-5-0-260128` | t2i, i2i, multi-image blending, batch generation, streaming |
| `seedream-5-0-lite-260128` | same as above, lighter |
| `seedream-4-5-251128` | t2i, i2i, multi-image, batch |
| `seedream-4-0-250828` | t2i, i2i, multi-image, batch |
| `seededit-3-0-i2i` | image editing (single image + prompt) |

### Key Request Parameters

```python
response = client.images.generate(
    model="seedream-5-0-260128",
    prompt="your prompt",
    image="https://... or data:image/png;base64,...",  # optional, for i2i
    size="2K",           # 1K | 2K | 4K  OR  "2048x2048" pixel dimensions
    response_format="url",          # "url" (24h link) | "b64_json"
    watermark=False,
    sequential_image_generation="auto",   # "auto" = batch | "disabled" = single
    stream=False,
)
# response.data[0].url  — image URL
# response.data[0].size — e.g. "2048x2048"
```

### Image Input Requirements

- Formats: JPEG, PNG, WEBP, BMP, TIFF, GIF
- Aspect ratio: [1/16, 16]
- Max size: 10MB per image, up to 14 reference images
- Max pixels: 6000×6000

### Batch Generation (seedream-5-0 / 4-5 / 4-0)

Set `sequential_image_generation="auto"` — model returns up to 15 related images.
Control max with `sequential_image_generation_options={"max_images": 10}`.

---

## 3. MULTIMODAL EMBEDDINGS API

**Endpoint:** `POST /embeddings/multimodal` (synchronous)
**Docs:** https://docs.byteplus.com/en/docs/ModelArk/1523520

### Models

| Model ID | Capabilities |
|---|---|
| `skylark-embedding-vision-251215` | Text + Image + Video → vectors, 2048-dim, Chinese & English |
| `skylark-embedding-vision-250615` | Same |

### Use Cases
- Image search by image (visual similarity)
- Semantic retrieval across text/image/video
- Cross-modal matching

### Key Request Parameters

```python
response = client.embeddings.create(
    model="skylark-embedding-vision-251215",
    input=[
        {"type": "text", "text": "search query"},
        {"type": "image_url", "image_url": {"url": "https://..."}},
        {"type": "video_url", "video_url": {"url": "https://..."}},
    ],
    encoding_format="float",   # "float" | "base64"
    dimensions=2048,           # 1024 | 2048
)
# response.data.embedding  — float[] vector
```

### Input Limits

- Text: UTF-8, ≤ 100,000 bytes, ≤ 8,000 tokens per text
- Images: jpeg/png/webp/bmp/tiff etc., aspect ratio [1/100, 100], ≤ 36M pixels
- Videos: mp4/avi/mov, ≤ 50MB, no audio understanding yet
- Rate: 1,200 RPM, 1,200K TPM

---

## 4. TEXT GENERATION / CHAT API

**Endpoint:** `POST /chat/completions`
**Docs:** https://docs.byteplus.com/en/docs/ModelArk/Chat

### Top Models

| Model ID | Highlights |
|---|---|
| `seed-2-0-pro-260328` | 256K context, deep reasoning, multimodal, tool calling, 30K RPM |
| `seed-2-0-lite-260228` | 256K context, deep reasoning, function calling, structured output |
| `seed-2-0-mini-260215` | 256K context, visual grounding, structured output |
| `seed-1-6-250915` | Image + video understanding, function calling |

### Key Features

- Deep reasoning (chain-of-thought, up to 128K CoT tokens)
- Multimodal understanding: images, video frames, documents
- Function/tool calling
- Structured output (JSON schema enforcement)
- Context caching (prefix + session caching via Responses API)
- Batch inference for high-volume offline jobs

```python
response = client.chat.completions.create(
    model="seed-2-0-lite-260228",
    messages=[
        {"role": "user", "content": "Explain this image"},
        {"role": "user", "content": [
            {"type": "image_url", "image_url": {"url": "https://..."}},
            {"type": "text", "text": "What's in this image?"}
        ]}
    ],
    max_tokens=4096,
)
```

---

## 5. QUICK REFERENCE — WHICH API FOR WHAT

| Goal | API | Model |
|---|---|---|
| Generate video from text | Video Generation | `dreamina-seedance-2-0-260128` |
| Generate video from image | Video Generation | `dreamina-seedance-2-0-260128` |
| Edit existing video | Video Generation | `dreamina-seedance-2-0-260128` (reference_video) |
| Chain scenes into long video | Video Generation | `dreamina-seedance-2-0-260128` + `return_last_frame` |
| Generate image from text | Image Generation | `seedream-5-0-260128` |
| Edit image with prompt | Image Generation | `seededit-3-0-i2i` |
| Generate batch of images | Image Generation | `seedream-5-0-260128` + `sequential_image_generation=auto` |
| Semantic image/video search | Embeddings | `skylark-embedding-vision-251215` |
| Chat / reasoning | Chat API | `seed-2-0-pro-260328` |
| Understand image/video content | Chat API | `seed-1-6-250915` |

---

## 6. PROJECT STRUCTURE (this workspace)

```
seedance_pipeline/       # OOP video pipeline package
  models.py              # Scene, PipelineConfig dataclasses
  env.py                 # .env loader + API key helper
  client.py              # VideoGenerationClient
  downloader.py          # Downloader
  editor.py              # VideoEditor (ffmpeg concat)
  pipeline.py            # VideoPipeline orchestrator
run_pipeline.py          # Entry point — edit SCENES & CONFIG here
python/demo_standard.py  # Original SDK demo
.env                     # ARK_API_KEY=...
output/                  # Generated clips + final video (gitignored)
```

SDK client init:
```python
from seedance_pipeline.env import get_api_key
from byteplussdkarkruntime import Ark
client = Ark(api_key=get_api_key())
```
