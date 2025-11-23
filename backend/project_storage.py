"""Utilities for persisting uploaded project artifacts on disk."""
from __future__ import annotations

from pathlib import Path
import re
from typing import Dict

PROJECTS_ROOT = Path(__file__).resolve().parent / "projects"
_PROJECT_DIR_PATTERN = re.compile(r"proj_(\d+)$")


def _next_project_id(root: Path) -> int:
    existing_ids = [
        int(match.group(1))
        for path in root.iterdir()
        if path.is_dir() and (match := _PROJECT_DIR_PATTERN.fullmatch(path.name))
    ]
    return max(existing_ids, default=0) + 1


def _sanitize_filename(filename: str | None) -> str:
    """Return a filesystem-safe filename."""
    if not filename:
        return "job_description.txt"
    return Path(filename).name or "job_description.txt"


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
