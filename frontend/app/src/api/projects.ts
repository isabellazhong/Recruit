const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface CreateProjectResponse {
    id: number;
    project_dir: string;
    job_title_path: string;
    job_desc_path: string;
    job_description_name: string;
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
