import mimetypes
import os
from pathlib import Path
from typing import Any, Iterable

from google import genai


class GeminiCLient:
    """Gemini Client to take in images and pdfs"""

    _IMAGE_EXTENSIONS = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
        ".heic": "image/heic",
    }

    def __init__(self, model: str, system_prompt: str | None = None):
        self.model = model
        self.system_prompt = system_prompt

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise EnvironmentError("GEMINI_API_KEY environment variable is not set.")

        self.client = genai.Client(api_key=api_key)

    def upload_pdf(self, file_path: str, display_name: str | None = None):
        """Upload a PDF for later use in multimodal prompts."""
        resolved_path = self._validate_path(file_path)
        return self._upload_file(
            resolved_path,
            mime_type="application/pdf",
            display_name=display_name,
        )

    def upload_image(
        self,
        file_path: str,
        display_name: str | None = None,
        mime_type: str | None = None,
    ):
        """Upload an image and automatically infer the MIME type when omitted."""
        resolved_path = self._validate_path(file_path)
        image_mime = mime_type or self._guess_image_mime(resolved_path)
        if not image_mime:
            raise ValueError("Unable to determine MIME type for the provided image.")

        return self._upload_file(
            resolved_path,
            mime_type=image_mime,
            display_name=display_name,
        )

    def generate_with_files(self, prompt: str, files: Iterable[Any]):
        """Call the Gemini model with a text prompt plus previously uploaded files."""
        parts = [{"text": prompt}]
        for file in files:
            parts.append(
                {
                    "file_data": {
                        "file_uri": file.uri,
                        "mime_type": getattr(file, "mime_type", None),
                    }
                }
            )

        return self.client.models.generate_content(
            model=self.model,
            contents=[{"role": "user", "parts": parts}]
        )

    def _upload_file(self, file_path: Path, mime_type: str, display_name: str | None):
        display = display_name or file_path.name
        return self.client.files.upload(
            file=str(file_path),
            mime_type=mime_type,
            display_name=display,
        )

    def _validate_path(self, file_path: str) -> Path:
        resolved = Path(file_path).expanduser().resolve()
        if not resolved.is_file():
            raise FileNotFoundError(f"File does not exist: {resolved}")
        return resolved

    def _guess_image_mime(self, file_path: Path) -> str | None:
        ext = file_path.suffix.lower()
        if ext in self._IMAGE_EXTENSIONS:
            return self._IMAGE_EXTENSIONS[ext]
        mime, _ = mimetypes.guess_type(file_path.name)
        return mime
