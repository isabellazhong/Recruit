import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
# Ensure imports resolve when the script is executed via an absolute path
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.gemini.gemini_client import GeminiClient

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
    file = client.upload_pdf("backend/gemini/test/Isabella Zhong Resume - Amazon.pdf")
    latex = client.generate_latex_resume(file, job_description=job, accuracy=80)
    print(latex)