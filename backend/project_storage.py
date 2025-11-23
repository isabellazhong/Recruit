"""Utilities for persisting uploaded project artifacts on disk."""
from __future__ import annotations

from pathlib import Path
import re
from typing import Dict, Tuple

PROJECTS_ROOT = Path(__file__).resolve().parent / "projects"
_PROJECT_DIR_PATTERN = re.compile(r"proj_(\d+)$")


def _next_project_id(root: Path) -> int:
    existing_ids = [
        int(match.group(1))
        for path in root.iterdir()
        if path.is_dir() and (match := _PROJECT_DIR_PATTERN.fullmatch(path.name))
    ]
    return max(existing_ids, default=0) + 1


def _sanitize_filename(filename: str | None, default: str = "job_description.txt") -> str:
    """Return a filesystem-safe filename."""
    if not filename:
        return default
    return Path(filename).name or default


def _latest_project_dir(root: Path) -> Tuple[int, Path]:
    """Return the most recently created project directory."""
    project_dirs = [
        (int(match.group(1)), path)
        for path in root.iterdir()
        if path.is_dir() and (match := _PROJECT_DIR_PATTERN.fullmatch(path.name))
    ]

    if not project_dirs:
        raise FileNotFoundError("No projects found. Create a project before uploading artifacts.")

    project_dirs.sort(key=lambda item: item[0], reverse=True)
    project_id, project_path = project_dirs[0]
    return project_id, project_path


def create_project_workspace(job_title: str, job_desc_bytes: bytes, job_desc_filename: str | None = None) -> Dict[str, str | int]:
    """Persist project inputs inside backend/projects/proj_<id> structure."""

    PROJECTS_ROOT.mkdir(parents=True, exist_ok=True)

    project_id = _next_project_id(PROJECTS_ROOT)
    project_dir = PROJECTS_ROOT / f"proj_{project_id}"
    job_title_dir = project_dir / "job_title"
    job_desc_dir = project_dir / "job_desc"
    job_title_dir.mkdir(parents=True, exist_ok=False)
    job_desc_dir.mkdir(parents=True, exist_ok=False)

    title_path = job_title_dir / "title.txt"
    title_text = job_title.strip()
    title_path.write_text(title_text + ("\n" if title_text else ""), encoding="utf-8")

    safe_name = _sanitize_filename(job_desc_filename)
    job_desc_path = job_desc_dir / safe_name
    job_desc_path.write_bytes(job_desc_bytes)

    return {
        "id": project_id,
        "project_dir": str(project_dir),
        "job_title_path": str(title_path),
        "job_desc_path": str(job_desc_path),
        "job_description_name": safe_name,
    }


def save_original_resume(resume_bytes: bytes, resume_filename: str | None = None) -> Dict[str, str | int]:
    """Persist the uploaded resume into the latest project directory under orig_resume."""

    if not resume_bytes:
        raise ValueError("Uploaded resume is empty.")

    PROJECTS_ROOT.mkdir(parents=True, exist_ok=True)
    project_id, project_dir = _latest_project_dir(PROJECTS_ROOT)

    resume_dir = project_dir / "orig_resume"
    resume_dir.mkdir(parents=True, exist_ok=True)

    safe_name = _sanitize_filename(resume_filename, default="resume_upload")
    resume_path = resume_dir / safe_name
    resume_path.write_bytes(resume_bytes)

    return {
        "id": project_id,
        "orig_resume_path": str(resume_path),
        "resume_filename": safe_name,
    }


def replace_job_description(job_description: str) -> Dict[str, str | int]:
    """Replace the latest project's job description contents with provided text."""

    if not job_description.strip():
        raise ValueError("Job description text is empty.")

    PROJECTS_ROOT.mkdir(parents=True, exist_ok=True)
    project_id, project_dir = _latest_project_dir(PROJECTS_ROOT)

    job_desc_dir = project_dir / "job_desc"
    job_desc_dir.mkdir(parents=True, exist_ok=True)

    # Remove existing files before writing the new tailored text
    for path in job_desc_dir.iterdir():
        if path.is_file():
            path.unlink()

    job_desc_path = job_desc_dir / "job_description.txt"
    job_desc_path.write_text(job_description, encoding="utf-8")

    return {
        "id": project_id,
        "job_desc_path": str(job_desc_path),
    }
