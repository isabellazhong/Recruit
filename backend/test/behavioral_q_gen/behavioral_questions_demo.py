"""Quick manual test harness for generate_behavioral_questions.

Edit the inline defaults or provide --resume/--job file paths to try new prompts.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from textwrap import dedent

# Ensure the backend directory is on sys.path after moving this script deeper.
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from gemini.gemini_client import GeminiClient  # noqa: E402
from use_cases.behavioral_questions import generate_behavioral_questions  # noqa: E402

DEFAULT_RESUME = dedent(
    r"""
        \documentclass[10pt]{article}
    \usepackage{geometry}
    \geometry{margin=0.5in}

    \usepackage{enumitem}
    \setlist[itemize]{noitemsep,topsep=2pt,parsep=0pt,partopsep=0pt,leftmargin=1.5em}

    \usepackage[utf8]{inputenc}
    \usepackage[T1]{fontenc}
    \usepackage{helvet}
    \renewcommand{\familydefault}{\sfdefault}

    \usepackage{xcolor}
    \usepackage[hidelinks]{hyperref}

    \usepackage{titlesec}
    \titlespacing*{\section}{0pt}{8pt}{4pt}
    \titleformat{\section}{\Large\bfseries\raggedright}{}{0em}{}

    \usepackage{ragged2e}

    \newcommand{\entry}[4]{
        \textbf{#1} \hfill \textbf{#2} \\
        #3 \hfill #4 \\
        \vspace{2pt}
    }

    \begin{document}
    \RaggedRight

    \begin{center}
        {\Huge\bfseries Isabella Zhong} \\
        \vspace{2pt}
        \href{mailto:isabellazhong888@gmail.com}{\color{black}isabellazhong888@gmail.com} $|$ (647) 537-6108 $|$ \href{https://linkedin.com/in/isabella-zhong}{\color{black}linkedin.com/in/isabella-zhong} $|$ \href{https://github.com/isabellazhong}{\color{black}github.com/isabellazhong}
    \end{center}

    \vspace{8pt}

    \section*{EDUCATION}
    \entry{University of Toronto}{Sep 2024 -- 2028 (Expected)}{Bachelor of Science, Computer Science Major}{}
    \begin{itemize}
        \item Cultivating strong understanding of Computer Science fundamentals, data structures, and algorithms through comprehensive coursework.
        \item Relevant Coursework: Software Design, Foundations of Computer Science II, Theory of Computation.
        \item Clubs: Google Developer Group, University of Toronto Machine Intelligence Student Team.
    \end{itemize}

    \section*{EXPERIENCE}
    \entry{BMO}{Apr 2025 -- Aug 2025}{Software Developer Intern}{}
    \begin{itemize}
        \item Developed an LLM-powered RAG model with AWS Bedrock, optimizing software development lifecycle (SDLC) efficiency in an agile environment.
        \item Architected and deployed scalable cloud infrastructure using AWS S3, SQS, and API Gateway via AWS CDK.        
        \item Ensured code quality and reliability by developing unit tests for semantic chunking in Java, Python, and JavaScript, achieving 90\% code coverage.
        \item Designed and implemented a Next.js-based chatbot interface, integrating with MCP backend and successfully demonstrating to stakeholders.
        \item \textit{Tech Stack:} Typescript, Python, AWS (S3, SQS, API Gateway), Next.js.
    \end{itemize}

    \section*{LEADERSHIP}
    \entry{Google Developer Club}{Apr 2025 -- Present}{Marketing Vice Lead}{}
    \begin{itemize}
        \item Led a 20-member marketing team, overseeing graphic design and social media initiatives for 500+ attendees.    
        \item Collaborated with executive leadership to align marketing strategies with product and event launches.
        \item Increased social media engagement by over 600\% and boosted applicant engagement by 50\% through innovative campaigns.
    \end{itemize}

    \section*{PROJECTS}
    \entry{Hack the Valley -- Justastartup}{Oct 2025}{Full-Stack Business Accelerator}{}
    \begin{itemize}
        \item Developed a full-stack business accelerator prototype providing automated insights for business planning.     
        \item Integrated SerpApi for real-time competitor and trend analysis to inform strategic decisions.
        \item Deployed scalable infrastructure using Vercel and Supabase, optimizing performance and user experience.       
        \item \textit{Tech Stack:} Typescript, React, Supabase, Vercel.
    \end{itemize}

    \entry{Hack the 6ix -- Marker}{July 2025}{Multimodal RAG Pipeline}{}
    \begin{itemize}
        \item Collaborated in a multidisciplinary team on a full-stack prototype to enhance student learning.
        \item Implemented a multimodal RAG pipeline using FAISS and LangChain for intelligent document search and retrieval.
        \item \textit{Tech Stack:} Python, Next.js, LangChain.
    \end{itemize}

    \entry{ReturnX -- Hack the Future Case Competition}{Mar 2025}{FinTech Solution Prototype}{}
    \begin{itemize}
        \item Conceptualized a sustainable FinTech solution to mitigate e-commerce return inefficiencies.
        \item Designed intuitive UI/UX using Figma, adhering to established design principles.
        \item Awarded Top 5 Finalist (out of 36 teams) at Google Headquarters for innovative problem-solving.
        \item \textit{Tech Stack:} Figma.
    \end{itemize}

    \section*{SKILLS}
    \textbf{Languages:} Java, Python, JavaScript, TypeScript, HTML/CSS \\
    \textbf{Frameworks/Libraries:} React, Next.js, NumPy, Pandas, Svelte, Tailwind CSS, LangChain, MCP \\
    \textbf{Tools \& Platforms:} AWS CDK, Git, Figma, Vercel, Supabase \\
    \textbf{Methodologies \& Concepts:} Scrum Development, Design Thinking, Agile, Data Structures \& Algorithms

    \end{document}
    """
).strip()

DEFAULT_JOB_DESCRIPTION = dedent(
    """
    Overview

    Working at Atlassian

    Atlassians can choose where they work – whether in an office, from home, or a combination of the two. That way, Atlassians have more control over supporting their family, personal goals, and other priorities. We can hire people in any country where we have a legal entity. Interviews and onboarding are conducted virtually, a part of being a distributed-first company.

    Your Future Org

    Atlassian’s Intern program combines hands-on technical training, professional growth opportunities, dedicated mentorship, and strong social connections. This holistic approach empowers students to hit the ground running and sets them up for a successful and impactful career at Atlassian!

    This role is located in British Columbia. You must be willing and able to work out of this time zone to qualify.

    Our intern roles are not eligible for Canada work visa sponsorship now or in the future. Candidates with student work permit or any open work permit are welcome to apply.

    Your Future Team

    Join Atlassian's world-class engineering organization where technical excellence meets AI-driven innovation. Our elite engineers build cutting-edge solutions that enhance user experiences at scale, leveraging artificial intelligence to transform how millions of teams collaborate. We maintain the highest standards through data-driven insights and agile methodologies. Every engineer is empowered to contribute breakthrough ideas in AI-powered features and take ownership of impactful solutions, creating industry-leading products that redefine the future of teamwork.

    Responsibilities

    From day one, you will be a valued part of our development team, trusted to make changes to code that directly impact our products, while gaining deep technical knowledge in full lifecycle product development. You will report to Senior Engineers on your team and dream up and code new features that can be shipped straight into our products.

    As part of a unified R&D team, Engineering is prioritizing key initiatives which support our customers in moving to cloud while simultaneously continuing to bring the most value to our customers through investments across our core product suite – including Jira, Confluence, Trello, and Bitbucket.

    Qualifications

    Minimum Qualifications

    Able to commit to a 15-week full-time (40hrs/week) program during Summer 2026
    Currently enrolled full-time in a Bachelor or Master degree program at a Canadian university and returning to the program after the completion of the internship, graduating by June 2027
    Programming Foundation: Proficiency in Java, Python, C, C++, or other object-oriented programming languages through coursework or personal projects
    Technical Fundamentals: Understanding of data structures, algorithms, and their practical applications in problem-solving


    Preferred Qualifications

    Software Engineering Experience: Demonstrated skills through previous internships, work experience, personal projects, open-source contributions, or technical publications
    AI/ML Interest: Exposure to artificial intelligence concepts, machine learning frameworks, or emerging AI technologies (MCP, agentic AI) through coursework, projects, or self-learning
    System Design Awareness: Basic understanding of common design patterns and their applications in software architecture
    """
).strip()


def _load_text(path: str | None, fallback: str) -> str:
    if not path:
        return fallback
    data = Path(path).read_text(encoding="utf-8")
    cleaned = data.strip()
    if not cleaned:
        raise ValueError(f"Provided file '{path}' is empty.")
    return cleaned


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate three behavioral interview questions with Gemini 2.5 Flash."
    )
    parser.add_argument(
        "--resume",
        type=str,
        help="Path to a text file containing the candidate's resume (defaults to inline sample).",
    )
    parser.add_argument(
        "--job",
        type=str,
        help="Path to a text file containing the job description (defaults to inline sample).",
    )
    parser.add_argument(
        "--model",
        default="gemini-2.5-flash",
        help="Gemini model name to use (default: gemini-2.5-flash).",
    )
    args = parser.parse_args()

    resume_text = _load_text(args.resume, DEFAULT_RESUME)
    job_text = _load_text(args.job, DEFAULT_JOB_DESCRIPTION)

    client = GeminiClient(model=args.model)
    questions = generate_behavioral_questions(client, resume_text, job_text)

    print("\nBehavioral questions:\n")
    print(json.dumps(questions, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
