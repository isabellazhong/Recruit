from gemini.gemini_client import GeminiClient
import re
from pathlib import Path

from dotenv import load_dotenv
from google.genai import types 

_ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH, override=False)


class ResumeEditor:
    def __init__(self, client:GeminiClient, job_description: str):
        self.client = client
        self.job_description = job_description

    def find_latex_code(self, response: str) -> str:
        """Extract the first LaTeX code block from a model response.""" 
        if not response or not response.strip():
            raise ValueError("Response is empty.")

        code_blocks = re.findall(r"```(?:latex)?\s*(.*?)```", response, flags=re.DOTALL | re.IGNORECASE)
        for block in code_blocks:
            if self._looks_like_latex(block):
                return block.strip()

        fallback = re.search(r"(\\documentclass[\s\S]+?\\end\{document\})", response, flags=re.IGNORECASE)
        if fallback:
            return fallback.group(1).strip()

        # fall back
        return response
    
    def _looks_like_latex(self, content: str) -> bool:
        """Heuristic check to verify the snippet resembles LaTeX."""
        return bool(
            re.search(r"\\documentclass", content)
            or re.search(r"\\begin\{document\}", content)
            or re.search(r"\\section\{", content)
            or re.search(r"\\```latex", content)
        )
    
    def generate_latex_resume(self, file: types.File):
        prompt = (
        "You are an expert Resume Writer and LaTeX Typesetter. Your goal is to rewrite the attached resume "
        "into a clean, professional, single-page LaTeX document tailored specifically to the Job Description provided.\n\n"
        
        "### KEY FORMATTING PRINCIPLES:\n"
        "1. **Structure:** Use a clean, modern layout (e.g., simple sections, clear headings). Avoid columns if they clutter the text. Keep headers left-aligned\n"
        "2. **Typography:** Use a professional sans-serif font (like Helvetica or Arial via packages). Ensure high readability.\n"
        "3. **Consolidate:** Fix any inconsistencies in spacing, dates, or bullet point formatting.\n\n"
        
        "### THE ONE-PAGE MANDATE:\n"
        "The output MUST be exactly one page. Use the following hierarchy to achieve this:\n"
        "1. Use the `geometry` package to adjust margins (e.g., 0.5in) to maximize space.\n"
        "2. Use the `enumitem` package to reduce vertical spacing between bullet points (`nolistsep`).\n"
        "3. Rewrite wordy sentences to be concise without losing meaning.\n"
        "4. Only as a last resort, slightly reduce the font size, but NEVER go below 10pt.\n\n"
        
        "### CONTENT OPTIMIZATION:\n"
        "1. **ATS Optimization:** Analyze the Job Description. Naturally integrate key hard skills and keywords into the resume summary and experience bullets.\n"
        "2. **Impact:** Rewrite bullet points using the Google 'XYZ' formula (Accomplished [X] as measured by [Y], by doing [Z]) or the STAR method.\n"
        "3. **Relevance:** Emphasize experience relevant to the Job Description and de-emphasize irrelevant roles.\n\n"
        
        "### OUTPUT RULES:\n"
        "1. Return valid, compilable LaTeX code only.\n"
        "2. Wrap the code in \\begin{document}...\\end{document}.\n"
        "3. Do not include any markdown blocks (```latex), preambles, or conversational text.\n\n"
        
        f"### JOB DESCRIPTION:\n{self.job_description}"
        )

        response = self.client.getFileResponse(prompt, file)

        return self.find_latex_code(response)

