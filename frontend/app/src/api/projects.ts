const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface CreateProjectResponse {
    id: number;
    project_dir: string;
    job_title_path: string;
    job_desc_path: string;
    job_description_name: string;
}

export interface UploadResumeResponse {
    id: number;
    orig_resume_path: string;
    resume_filename: string;
}

export interface JobDescriptionUpdateResponse {
    id: number;
    job_desc_path: string;
}

export async function uploadProject(title: string, jobFile: File): Promise<CreateProjectResponse> {
    const formData = new FormData();
    formData.append("job_title", title);
    formData.append("job_desc", jobFile);

    const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create project");
    }

    return response.json();
}

export async function uploadOriginalResume(resumeFile: File): Promise<UploadResumeResponse> {
    const formData = new FormData();
    formData.append("resume", resumeFile);

    const response = await fetch(`${API_BASE_URL}/api/projects/latest/resume`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to upload resume");
    }

    return response.json();
}

export async function updateLatestJobDescription(jobDescription: string): Promise<JobDescriptionUpdateResponse> {
    const response = await fetch(`${API_BASE_URL}/api/projects/latest/job-desc`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jobDescription }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update job description");
    }

    return response.json();
}

export interface LatexConversionResponse {
    latex: string;
}

export interface TechnicalQuestion {
    id?: string;
    title?: string;
    difficulty?: string;
    problem_description?: string;
    starter_code?: string;
    desc?: string;
    tags?: string[];
    input_output?: Array<{ input?: string; output?: string }>;
    language?: string;
}

export interface BehavioralQuestionsResponse {
    questions: string[];
}

export async function convertResumeToLatex(resumeFile: File, jobDescription?: string): Promise<LatexConversionResponse> {
    const formData = new FormData();
    formData.append("resume", resumeFile);
    if (jobDescription && jobDescription.trim()) {
        formData.append("job_description", jobDescription.trim());
    }

    const response = await fetch(`${API_BASE_URL}/api/resume/latex`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to convert resume to LaTeX");
    }

    return response.json();
}

export async function fetchTechnicalQuestions(
    jobDescription: string,
    topK = 3,
    signal?: AbortSignal,
): Promise<TechnicalQuestion[]> {
    const payload = {
        job_description: jobDescription.trim(),
        top_k: topK,
    };

    const response = await fetch(`${API_BASE_URL}/api/technical-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch technical questions");
    }

    const data = await response.json();
    return Array.isArray(data.questions) ? data.questions : [];
}

export async function fetchBehavioralQuestions(
    resumeText: string,
    jobDescription: string,
): Promise<string[]> {
    const payload = {
        resume_text: resumeText.trim(),
        job_description: jobDescription.trim(),
    };

    const response = await fetch(`${API_BASE_URL}/api/behavioral-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate behavioral questions");
    }

    const data: BehavioralQuestionsResponse = await response.json();
    return Array.isArray(data.questions) ? data.questions : [];
}
