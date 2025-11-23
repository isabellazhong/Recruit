"""HTTP interface for project creation and other backend features."""
from __future__ import annotations

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .project_storage import create_project_workspace

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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
