import os
import mimetypes 
from pathlib import Path
from typing import Any

from google import genai
from google.genai import types 

class GeminiClient:
    """Gemini Client (Google Gen AI SDK v1.0+)"""

    _IMAGE_EXTENSIONS = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
        ".heic": "image/heic",
    }

    def __init__(self, model: str):
        self.model = model
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise EnvironmentError("GEMINI_API_KEY environment variable is not set.")

        # Initialize the new Client
        self.client = genai.Client(api_key=api_key)

    def upload_pdf(self, file_path: str, display_name: str | None = None):
        resolved_path = self._validate_path(file_path)
        return self._upload_file(
            resolved_path,
            mime_type="application/pdf",
            display_name=display_name,
        )

    def upload_image(self, file_path: str, display_name: str | None = None, mime_type: str | None = None):
        resolved_path = self._validate_path(file_path)
        
        image_mime = mime_type or self._guess_image_mime(resolved_path)
        
        if not image_mime:
            raise ValueError("Unable to determine MIME type.")

        return self._upload_file(
            resolved_path,
            mime_type=image_mime,
            display_name=display_name,
        )

    def _upload_file(self, file_path: Path, mime_type: str, display_name: str | None) -> types.File:
        """
        Uploads to the File API.
        Returns a google.genai.types.File object.
        """
        display = display_name or file_path.name
        return self.client.files.upload(
            file=str(file_path),
            config=types.UploadFileConfig(
                display_name=display, 
                mime_type=mime_type
            )
        )
    
    def generate_latex_resume(self, file: types.File, job_description: str, accuracy: int):
        prompt = (
            "You are a resume perfector. Turn this file into LaTeX.\n"
            "Reformat the resume if there are inconsistencies in spacing, font, etc.\n"
            "If the resume is not one page, adjust font-size to fit one page.\n"
            "Adjust wording to match key words in the description below so there is "
            f"at least a {accuracy}% chance it passes screening.\n\n"
            f"JOB DESCRIPTION:\n{job_description}"
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=[prompt, file]
        )

        return response.text

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