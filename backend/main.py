"""HTTP interface for project creation and other backend features."""
from __future__ import annotations

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .project_storage import create_project_workspace, replace_job_description, save_original_resume

app = FastAPI(title="Recruit Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/projects")
async def create_project(job_title: str = Form(...), job_desc: UploadFile = File(...)) -> dict:
    contents = await job_desc.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded job description is empty.")

    project_info = create_project_workspace(job_title=job_title, job_desc_bytes=contents, job_desc_filename=job_desc.filename)
    return project_info


class JobDescriptionPayload(BaseModel):
    job_description: str


@app.post("/api/projects/latest/resume")
async def upload_original_resume(resume: UploadFile = File(...)) -> dict:
    contents = await resume.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded resume is empty.")

    try:
        return save_original_resume(contents, resume.filename)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.put("/api/projects/latest/job-desc")
async def update_job_description(payload: JobDescriptionPayload) -> dict:
    try:
        return replace_job_description(payload.job_description)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
