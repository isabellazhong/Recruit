"""HTTP interface for project creation and other backend features."""
from __future__ import annotations

import os
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .project_storage import (
    create_project_workspace,
    load_latest_job_description,
    replace_job_description,
    save_original_resume,
)
from .use_cases.resume_editor import ResumeEditor
from .use_cases.technical_questions import TechnicalQuestionsGenerator
from .gemini.gemini_client import GeminiClient
from .use_cases.behavioral_questions import generate_behavioral_questions

GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")
GEMINI_CLIENT = GeminiClient(model=GEMINI_MODEL_NAME)

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


class TechnicalQuestionsPayload(BaseModel):
    job_description: str
    top_k: int | None = 3

class BehavioralQuestionsPayload(BaseModel):
    resume_text: str
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


@app.post("/api/resume/latex")
async def convert_resume_to_latex(resume: UploadFile = File(...), job_description: str | None = Form(None)) -> dict:
    contents = await resume.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded resume is empty.")

    job_text = (job_description or "").strip()
    if not job_text:
        try:
            _, job_text = load_latest_job_description()
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        save_original_resume(contents, resume.filename)
    except FileNotFoundError:
        # Allow conversion even if a project has not been created yet
        pass
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    suffix = Path(resume.filename or "resume").suffix or ".pdf"
    with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(contents)
        temp_path = temp_file.name

    try:
        gemini_file = GEMINI_CLIENT.upload_document(temp_path, display_name=resume.filename)
        resume_editor = ResumeEditor(GEMINI_CLIENT, job_text)
        latex = resume_editor.generate_latex_resume(gemini_file)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate LaTeX resume: {exc}") from exc
    finally:
        Path(temp_path).unlink(missing_ok=True)

    return {"latex": latex}


@app.post("/api/technical-questions")
async def get_technical_questions(payload: TechnicalQuestionsPayload) -> dict:
    job_desc = payload.job_description.strip()
    if not job_desc:
        raise HTTPException(status_code=400, detail="Job description text is empty.")

    top_k = payload.top_k or 3
    top_k = max(1, min(top_k, 10))

    try:
        generator = TechnicalQuestionsGenerator(job_description=job_desc)
        questions = generator.find_top_questions(top_k)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch technical questions: {exc}") from exc

    return {"questions": questions}

@app.post("/api/behavioral-questions")
async def get_behavioral_questions(payload: BehavioralQuestionsPayload) -> dict:
    resume_text = payload.resume_text.strip()
    job_desc = payload.job_description.strip()

    if not resume_text:
        raise HTTPException(status_code=400, detail="Resume text is empty.")
    if not job_desc:
        raise HTTPException(status_code=400, detail="Job description text is empty.")

    try:
        return generate_behavioral_questions(GEMINI_CLIENT, resume_text, job_desc)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate behavioral questions: {exc}",
        ) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
