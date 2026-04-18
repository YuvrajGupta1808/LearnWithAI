import os
from pathlib import Path


def load_env(env_path: Path = None) -> None:
    """Load key=value pairs from a .env file into os.environ."""
    if env_path is None:
        # Walk up from this file to find .env in project root
        env_path = Path(__file__).parent.parent / ".env"

    if not env_path.exists():
        return

    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())


def get_api_key() -> str:
    load_env()
    api_key = os.environ.get("ARK_API_KEY", "").strip()
    if not api_key:
        api_key = input("Enter your ARK API Key: ").strip()
    if not api_key:
        raise ValueError("ARK_API_KEY is required. Set it in .env or as an environment variable.")
    masked = f"...{api_key[-6:]}" if len(api_key) > 6 else "***"
    print(f"Using ARK_API_KEY ending with {masked}")
    return api_key
