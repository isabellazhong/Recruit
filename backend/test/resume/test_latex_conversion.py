import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from gemini.gemini_client import GeminiClient
from use_cases.job_formatter import JobFormatter
from use_cases.resume_editor import ResumeEditor

if __name__ == "__main__":
    job = """
What you’ll do:
• Demonstrate accountability and quality in your work while receiving support and guidance from your mentor, manager, and peers
• Execute scoped technical tasks end-to-end to help build the future of Pinterest
• Deliver code that is well-documented, tested, and operable
• Communicate new ideas and opinions with candor as you grow both professionally and personally through learning and development opportunities
• Collaborate with your team and contribute to real projects that impact Pinterest
• Opportunities to interact with leaders and employees across Pinterest and to participate in a variety of optional company events

What we’re looking for:
• This position requires current enrollment in a school or education program in which the individual is working towards a Bachelor’s in Computer Science or related technical field
• Obtain Bachelor's in Computer Science or related technical field by June 2028
• 2-3 years of CS classes under your belt (Intro to CS and Algorithms, Advanced Algorithms, Operating Systems and Data Structures are all great!)
• Ability to demonstrate an understanding of computer science fundamentals, including data structures and algorithms.
• Aptitude for JavaScript, CSS, C++, HTML, Python, Java, Go–we use a variety of programming languages and tools
• Non-academic coding experience (i.e. hack-a-thons, code challenges, personal projects, GitHub, Open Source, volunteer coding experience, conference participation, etc.)
• A curious nature with a desire to tackle and solve complex problem
    """

    client = GeminiClient(model="gemini-2.5-flash")
    job_formatter = JobFormatter(client, job)

    job_desc = job_formatter.summarize_job_description()
    resume_editor = ResumeEditor(client, job_desc)

    resume_path = Path(__file__).resolve().with_name("Isabella Zhong Resume - Amazon.pdf")
    file = client.upload_pdf(str(resume_path))
    latex = resume_editor.generate_latex_resume(file)
    print(latex)