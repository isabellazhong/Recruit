
import { Plus } from "lucide-react";

interface UploadProjectProps {
    onClick: () => void; 
}

export function UploadProject({onClick}: UploadProjectProps) {
    return (
         <button className="project-card project-card__new" onClick={onClick}>
            <Plus size={20} />
            <span>Start from job posting</span>
            <p>Upload a new job description and Recruit will tailor prompts, drills, and feedback.</p>
        </button>
    );
}