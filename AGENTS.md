# Repository Guidelines

## Project Structure & Module Organization
Core pipeline code lives in `seedance_pipeline/`. Key modules include `pipeline.py` for orchestration, `script_agent.py` for scene generation, `image_client.py` and `narration_agent.py` for media creation, and `models.py` for shared dataclasses such as `Scene` and `PipelineConfig`. Top-level entry points are `run_pipeline.py` for the async end-to-end flow and `python/demo_standard.py` for the SDK example. Tests live in `tests/`. Setup helpers are under `scripts/init_dev_env/`. Generated media and JSON outputs belong in `output/` and should not be treated as source files.

## Build, Test, and Development Commands
Use the provided setup scripts to create `.venv` and install dependencies:

- `bash scripts/init_dev_env/setup_mac.sh`: create a Python 3.12 virtual environment on macOS/Linux.
- `scripts\\init_dev_env\\setup_windows.bat`: Windows setup flow.
- `.venv/bin/python run_pipeline.py`: run the full Seedance pipeline and write artifacts to `output/`.
- `.venv/bin/python python/demo_standard.py`: run the standalone SDK editing example.
- `.venv/bin/python -m pytest tests/test_script_agent.py -v -s`: run the current integration-style test.

## Coding Style & Naming Conventions
Follow existing Python style: 4-space indentation, `snake_case` for functions and modules, `PascalCase` for classes, and concise docstrings on public helpers. Keep modules focused; new pipeline steps should usually live in `seedance_pipeline/` rather than in top-level scripts. Prefer typed function signatures and `dataclass` models when extending shared payloads.

## Testing Guidelines
Current coverage is centered on `unittest`-based API integration in `tests/test_script_agent.py`. Name new test files `test_*.py` and keep test methods descriptive, for example `test_prompts_are_detailed_enough`. If a test calls real BytePlus services, document that clearly and avoid running it in CI without credentials. Store golden JSON or sample outputs in `tests/`, not in `output/`.

## Security & Configuration Tips
Set `ARK_API_KEY` in `.env` or your shell environment. Never hardcode credentials in Python files, scripts, or committed test fixtures. Treat generated videos, narration, and seed images as disposable artifacts unless they are needed as explicit examples.

## Commit & Pull Request Guidelines
This workspace does not include `.git` history, so no repository-specific commit convention could be verified. Use short imperative commit subjects, keep each commit scoped to one change, and describe API-impacting behavior in the body. PRs should summarize the user-visible change, list test coverage, and include sample output paths or screenshots when media generation behavior changes.
