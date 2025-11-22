"""Send an interview response video to Gemini 2.5 Flash for coaching feedback."""
from __future__ import annotations

import argparse
import os
import platform
from pathlib import Path

from google import genai
from google.genai import types

API_KEY_ENV = "GEMINI_API_KEY"
API_KEY_DIR = Path(__file__).resolve().parent / "api_keys"
OS_KEY_HINT = {"Darwin": "mac_api_key.txt", "Windows": "windows_api_key.txt"}
INLINE_LIMIT_BYTES = 20 * 1024 * 1024
DEFAULT_PROMPT = (
    "Watch this interview response and share concise, actionable coaching to improve "
    "body language, vocal delivery, and confidence."
)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Send an interview clip to Gemini 2.5 Flash using inline upload (<20MB) or the Files API."
    )
    parser.add_argument(
        "-v",
        "--video",
        type=Path,
        required=True,
        help="Path to the interview MP4 you want Gemini to review.",
    )
    parser.add_argument(
        "-p",
        "--prompt",
        default=DEFAULT_PROMPT,
        help="Override the default coaching prompt sent to Gemini.",
    )
    parser.add_argument(
        "--model",
        default="gemini-2.5-flash",
        help="Gemini model name to call (default: gemini-2.5-flash).",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.2,
        help="Sampling temperature for generation (lower is more deterministic).",
    )
    parser.add_argument(
        "--max-output-tokens",
        type=int,
        default=600,
        help="Maximum tokens for the Gemini response.",
    )
    parser.add_argument(
        "--api-key-file",
        type=Path,
        help="Optional path to a text file that contains a GEMINI_API_KEY entry.",
    )
    parser.add_argument(
        "--keep-upload",
        action="store_true",
        help="Skip deleting uploaded Files API artifacts (defaults to deleting after use).",
    )
    return parser.parse_args()


def _sanitize_key(raw: str | None) -> str | None:
    if raw is None:
        return None
    cleaned = raw.strip()
    if not cleaned:
        return None
    cleaned = cleaned.strip('"').strip("'")
    return cleaned or None


def _extract_key(path: Path) -> str | None:
    text = path.read_text(encoding="utf-8")
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith(API_KEY_ENV):
            _, _, maybe_value = line.partition("=")
            clean_value = _sanitize_key(maybe_value)
            if clean_value:
                return clean_value
        elif "=" in line:
            key, value = [segment.strip() for segment in line.split("=", 1)]
            if key.upper() == API_KEY_ENV:
                clean_value = _sanitize_key(value)
                if clean_value:
                    return clean_value
    stripped = _sanitize_key(text)
    return stripped or None


def _candidate_key_files(cli_path: Path | None) -> list[Path]:
    candidates: list[Path] = []
    if cli_path:
        candidates.append(cli_path.expanduser().resolve())
    system_name = platform.system()
    if system_name in OS_KEY_HINT:
        candidates.append(API_KEY_DIR / OS_KEY_HINT[system_name])
    if system_name:
        candidates.append(API_KEY_DIR / f"{system_name.lower()}_api_key.txt")
    candidates.extend(
        [
            API_KEY_DIR / "mac_api_key.txt",
            API_KEY_DIR / "windows_api_key.txt",
            API_KEY_DIR / "api_key.txt",
        ]
    )
    unique: list[Path] = []
    seen: set[Path] = set()
    for candidate in candidates:
        resolved = candidate.resolve()
        if resolved not in seen:
            unique.append(resolved)
            seen.add(resolved)
    return unique


def _load_api_key(args: argparse.Namespace) -> str:
    if key := os.getenv(API_KEY_ENV):
        return key
    for candidate in _candidate_key_files(args.api_key_file):
        if candidate.is_file() and (value := _extract_key(candidate)):
            return value
    raise SystemExit(
        "Set GEMINI_API_KEY in your environment or place an api_keys/<os>_api_key.txt file containing the value."
    )


def _format_size(num_bytes: int) -> str:
    return f"{num_bytes / (1024 ** 2):.2f} MB"


def _build_config(args: argparse.Namespace) -> types.GenerateContentConfig:
    return types.GenerateContentConfig(
        temperature=args.temperature,
        max_output_tokens=args.max_output_tokens,
    )


def _inline_content(prompt: str, video_bytes: bytes) -> types.Content:
    return types.Content(
        role="user",
        parts=[
            types.Part(
                inline_data=types.Blob(data=video_bytes, mime_type="video/mp4")
            ),
            types.Part(text=prompt),
        ],
    )


def _prompt_only_content(prompt: str) -> types.Content:
    return types.Content(
        role="user",
        parts=[types.Part(text=prompt)],
    )


def _generate_with_inline(
    client: genai.Client, args: argparse.Namespace, video_path: Path
) -> genai.types.GenerateContentResponse:
    video_bytes = video_path.read_bytes()
    print("Sending inline video data (<20MB) directly to Gemini...")
    return client.models.generate_content(
        model=args.model,
        contents=[_inline_content(args.prompt, video_bytes)],
        config=_build_config(args),
    )


def _generate_with_files_api(
    client: genai.Client, args: argparse.Namespace, video_path: Path
) -> genai.types.GenerateContentResponse:
    print("Uploading video via Files API (size exceeds 20 MB)...")
    upload = client.files.upload(file=str(video_path))
    try:
        response = client.models.generate_content(
            model=args.model,
            contents=[upload, _prompt_only_content(args.prompt)],
            config=_build_config(args),
        )
    finally:
        if not args.keep_upload:
            client.files.delete(name=upload.name)
            print("Deleted uploaded file from Gemini Files API.")
    return response


def _extract_text_parts(content: types.Content | None) -> list[str]:
    if not content or not getattr(content, "parts", None):
        return []
    collected: list[str] = []
    for part in content.parts or []:
        text = getattr(part, "text", None)
        if text and text.strip():
            collected.append(text.strip())
    return collected


def _summaries_from_response(response: genai.types.GenerateContentResponse) -> list[str]:
    summaries: list[str] = []
    if text := getattr(response, "text", None):
        summaries.append(text.strip())
    for candidate in getattr(response, "candidates", []) or []:
        summaries.extend(_extract_text_parts(getattr(candidate, "content", None)))
        if candidate_text := getattr(candidate, "text", None):
            summaries.append(candidate_text.strip())
    return [chunk for chunk in summaries if chunk]


def main() -> None:
    args = _parse_args()
    if not args.video.is_file():
        raise SystemExit(f"Video file not found: {args.video}")

    api_key = _load_api_key(args)
    client = genai.Client(api_key=api_key)

    video_size = args.video.stat().st_size
    print(f"Video detected: {args.video} ({_format_size(video_size)}).")

    if video_size <= INLINE_LIMIT_BYTES:
        response = _generate_with_inline(client, args, args.video)
    else:
        response = _generate_with_files_api(client, args, args.video)

    summaries = _summaries_from_response(response)
    print("\nGemini 2.5 Flash feedback:\n")
    if summaries:
        for paragraph in summaries:
            print(f"- {paragraph}")
    else:
        print("(Gemini did not return textual feedback.)")

if __name__ == "__main__":
    main()
