import {FolderOpen, Clock} from "lucide-react";
import "../../pages/home_page/HomePage.css";
import { Button } from "./Button";

type Project = {
	id: number;
	title: string;
	role: string;
	lastUpdated: string;
};

interface ProjectPanelProps {
    project: Project; 
    onClick: () => void;
}

export function ProjectPanel({project, onClick}: ProjectPanelProps) {
    return (
        <article className="project-card" key={project.id}>
            <header className="card-header">
                <div className="card-icon">
                    <FolderOpen size={20} />
                </div>
                <div>
                    <h3>{project.title}</h3>
                    <p>{project.role}</p>
                </div>
            </header>

            <div className="card-meta">
                <div className="meta-item">
                    <Clock size={16} />
                    <span>Updated {project.lastUpdated}</span>
                </div>
            </div>
            <Button onClick={onClick} label="Open workspace" />
        </article>
	);
}