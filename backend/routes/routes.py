import os
import sys
import tempfile
from pathlib import Path

from flask import Flask, jsonify, request

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path: 
    sys.path.append(str(REPO_ROOT))

from backend.gemini.gemini_client import GeminiClient
from backend.use_cases.behavioral_questions import generate_behavioral_questions
from backend.use_cases.job_formatter import JobFormatter
from backend.use_cases.resume_editor import ResumeEditor
from backend.use_cases.technical_questions import TechnicalQuestionsGenerator

gemini_client = GeminiClient("gemini-2.5-flash")

app = Flask("backend")


def _json_error(message: str, status_code: int = 400):
    return jsonify({"error": message}), status_code


@app.post("/summarize_job")
def summarize_job():
    payload = request.get_json(silent=True) or {}
    job_desc = (payload.get("job_description") or "").strip()
    if not job_desc:
        return _json_error("job_description is required")

    formatter = JobFormatter(gemini_client, job_desc)
    try:
        summary = formatter.summarize_job_description()
    except Exception as exc:  # pragma: no cover - logged upstream
        return _json_error(f"Failed to summarize job description: {exc}", 500)

    return jsonify({"summary": summary})


@app.post("/resume/latex")
def generate_resume_latex():
    job_description = (request.form.get("job_description") or "").strip()
    if not job_description:
        return _json_error("job_description form field is required")

    file_storage = request.files.get("resume")
    if file_storage is None or not file_storage.filename:
        return _json_error("A resume PDF must be uploaded using the 'resume' form field")

    suffix = Path(file_storage.filename).suffix.lower() or ".pdf"
    if suffix != ".pdf":
        return _json_error("Only PDF resumes are supported at this time")

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        file_storage.save(tmp_file.name)
        temp_path = tmp_file.name

    try:
        uploaded_file = gemini_client.upload_pdf(temp_path)
        editor = ResumeEditor(gemini_client, job_description)
        latex = editor.generate_latex_resume(uploaded_file)
    except ValueError as exc:
        return _json_error(str(exc))
    except Exception as exc:  # pragma: no cover - upstream SDK raises various errors
        return _json_error(f"Failed to generate LaTeX resume: {exc}", 500)
    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass

    return jsonify({"latex": latex})


@app.post("/behavioral_questions")
def behavioral_questions():
    payload = request.get_json(silent=True) or {}
    resume_text = (payload.get("resume") or "").strip()
    job_description = (payload.get("job_description") or "").strip()

    if not resume_text:
        return _json_error("resume is required")
    if not job_description:
        return _json_error("job_description is required")

    try:
        response = generate_behavioral_questions(
            client=gemini_client,
            resume=resume_text,
            job_description=job_description,
        )
    except ValueError as exc:
        return _json_error(str(exc))
    except Exception as exc:  # pragma: no cover
        return _json_error(f"Failed to generate behavioral questions: {exc}", 500)

    return jsonify(response)


@app.post("/technical_questions")
def technical_questions():
    payload = request.get_json(silent=True) or {}
    job_description = (payload.get("job_description") or "").strip()
    if not job_description:
        return _json_error("job_description is required")

    top_k_raw = payload.get("top_k", 3)
    try:
        top_k = int(top_k_raw)
    except (TypeError, ValueError):
        return _json_error("top_k must be an integer")

    if top_k <= 0:
        return _json_error("top_k must be greater than 0")

    try:
        generator = TechnicalQuestionsGenerator(job_description)
        questions = generator.find_top_questions(top_k)
    except Exception as exc:  # pragma: no cover
        return _json_error(f"Failed to generate technical questions: {exc}", 500)

    return jsonify({"questions": questions})


if __name__ == "__main__":
    app.run(debug=True)
