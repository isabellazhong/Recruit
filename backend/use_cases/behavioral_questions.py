"""Generate resume-aware behavioral interview questions with Gemini."""

from __future__ import annotations

import json
from typing import TypedDict

from gemini.gemini_client import GeminiClient
from google.genai import types


class BehavioralQuestionsResponse(TypedDict):
    """Structured response returned by ``generate_behavioral_questions``."""

    questions: list[str]


_BEHAVIORAL_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "questions": types.Schema(
            type=types.Type.ARRAY,
            description=(
                "Exactly three single-sentence behavioral interview questions "
                "tailored to the candidate's resume and the job description."
            ),
            items=types.Schema(
                type=types.Type.STRING,
                description="One realistic behavioral interview question.",
            ),
        )
    },
    required=["questions"],
)


def _build_prompt(resume: str, job_description: str) -> str:
    return (
        "You are a senior hiring manager preparing a behavioral interview. "
        "Write concise, professional, single-sentence behavioral questions "
        "that help gauge how the candidate has demonstrated key skills in the past.\n\n"
        "Instructions:\n"
        "- Focus on leadership, collaboration, ownership, and problem-solving scenarios.\n"
        "- Each question must reference themes, accomplishments, or gaps you infer from "
        "the resume and job description.\n"
        "- Avoid yes/no questions and keep them <= 30 words.\n"
        "- Do not include numbering, bullet points, or explanatory text.\n\n"
        f"Resume:\n{resume.strip()}\n\n"
        f"Job Description:\n{job_description.strip()}"
    )


def generate_behavioral_questions(
    client: GeminiClient, resume: str, job_description: str
) -> BehavioralQuestionsResponse:
    """Generate exactly three behavioral interview questions.

    Args:
        client: Configured ``GeminiClient`` (use the ``gemini-2.5-flash`` model).
        resume: The candidate's resume content as plain text.
        job_description: The target job description.

    Returns:
        A dict with a ``questions`` list containing three behavioral questions.

    Raises:
        ValueError: If inputs are empty or the Gemini response is malformed.
    """

    if not resume or not resume.strip():
        raise ValueError("resume cannot be empty")
    if not job_description or not job_description.strip():
        raise ValueError("job_description cannot be empty")

    prompt = _build_prompt(resume=resume, job_description=job_description)

    response = client.client.models.generate_content(
        model=client.model,
        contents=[types.Content(role="user", parts=[types.Part(text=prompt)])],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=_BEHAVIORAL_SCHEMA,
        ),
    )

    try:
        payload = json.loads(response.text or "{}")
    except json.JSONDecodeError as exc:
        raise ValueError("Gemini response was not valid JSON") from exc

    questions = payload.get("questions")
    if not isinstance(questions, list):
        raise ValueError("Gemini response did not include a 'questions' list")

    cleaned = [question.strip() for question in questions if isinstance(question, str) and question.strip()]

    if len(cleaned) != 3:
        raise ValueError("Gemini did not return exactly three questions")

    return {"questions": cleaned}
