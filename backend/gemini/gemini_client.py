import os
import mimetypes 
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types 

_FILE_PATH = Path(__file__).resolve()
_ENV_SEARCH_PATHS: list[Path] = []
_seen: set[Path] = set()

for depth in range(0, 4):
    try:
        directory = _FILE_PATH.parents[depth]
    except IndexError:
        break
    candidate = directory / ".env"
    if candidate not in _seen:
        _ENV_SEARCH_PATHS.append(candidate)
        _seen.add(candidate)

cwd_candidate = Path.cwd() / ".env"
if cwd_candidate not in _seen:
    _ENV_SEARCH_PATHS.append(cwd_candidate)

_loaded = False
for env_path in _ENV_SEARCH_PATHS:
    if env_path.is_file():
        load_dotenv(dotenv_path=env_path, override=False)
        _loaded = True
        break

if not _loaded:
    load_dotenv(override=False)

class GeminiClient:
    """Gemini Client (Google Gen AI SDK v1.0+)"""
    __instance = None 

    _IMAGE_EXTENSIONS = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
        ".heic": "image/heic",
    }

    def __new__(cls, *args, **kwargs):
        if cls.__instance is None:
            cls.__instance = super().__new__(cls)
            cls.__instance._initialized = False  # set once to avoid re-initialization
        return cls.__instance


    def __init__(self, model: str):
        if getattr(self, "_initialized", False):
            if model != self.model:
                raise ValueError(
                    "GeminiClient is a singleton and already initialized with model "
                    f"'{self.model}'."
                )
            return

        self.model = model
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise EnvironmentError("GEMINI_API_KEY environment variable is not set.")

        # Initialize the new Client
        self.client = genai.Client(api_key=api_key)
        self._initialized = True

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

    def upload_document(self, file_path: str, display_name: str | None = None, mime_type: str | None = None):
        resolved_path = self._validate_path(file_path)
        document_mime = mime_type or mimetypes.guess_type(resolved_path.name)[0] or "application/octet-stream"

        return self._upload_file(
            resolved_path,
            mime_type=document_mime,
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
    
    def getResponse(self, query:str):
        response = self.client.models.generate_content(model=self.model, contents=query)
        return response.text

    def getFileResponse(self, query:str, file:types.File):
        response = self.client.models.generate_content(model=self.model, contents=[query, file])
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
    
