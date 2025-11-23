import { useState } from "react";
import type { FormEvent } from "react";
import { Plus } from "lucide-react";
import { ProjectPanel } from "../../components/home_page/ProjectPanel";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import { UploadProject } from "../../components/home_page/UploadProjectPanel";
import { CreateProjectPanel } from "../../components/home_page/CreateProjectPanel";
import { uploadProject } from "../../api/projects";

type Project = {
	id: number;
	title: string;
	role: string;
	lastUpdated: string;
	jobDescriptionName?: string;
};

const INITIAL_PROJECTS: Project[] = [];

export default function HomePage() {
	const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [projectTitle, setProjectTitle] = useState("");
	const [jobFile, setJobFile] = useState<File | null>(null);
    const navigate = useNavigate(); 
    const openWorkspace = () => navigate('/workspace'); 


	const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmedTitle = projectTitle.trim();
		if (!trimmedTitle || !jobFile) return;

		try {
			const backendProject = await uploadProject(trimmedTitle, jobFile);
			const newProject: Project = {
				id: backendProject.id,
				title: trimmedTitle,
				role: "Custom role",
				lastUpdated: "Just now",
				jobDescriptionName: backendProject.job_description_name,
			};

			setProjects((prev) => [newProject, ...prev]);
			setProjectTitle("");
			setJobFile(null);
			setIsModalOpen(false);
		} catch (error) {
			console.error("Failed to upload project", error);
		}
	};

	return (
		<div className="home-page">
			<header className="home-header">
				<div>
					<p className="eyebrow">Recruit workspace</p>
					<h1>Projects</h1>
					<p>Spin up interview prep journeys tailored to every job description.</p>
				</div>
				<button className="primary-btn" onClick={() => setIsModalOpen(true)}>
					<Plus size={18} />
					New project
				</button>
			</header>

			<section className="project-panel">
				<div className="panel-header">
					<div>
						<p className="eyebrow">Active prep tracks</p>
						<h2>In progress</h2>
					</div>
					<span>{projects.length} projects</span>
				</div>

				<div className="project-grid">
					{projects.map((project) => {
						return <ProjectPanel project={project} onClick={openWorkspace}></ProjectPanel>
					})}

					<UploadProject onClick={() => setIsModalOpen(true)}></UploadProject>
				</div>
			</section>

			{isModalOpen && (
				<CreateProjectPanel
					onClose={() => setIsModalOpen(false)}
					onSubmit={handleCreateProject}
					currProjectTitle={projectTitle}
					setTitle={setProjectTitle}
					jobFile={jobFile}
					setJobFile={setJobFile}
				/>
			)}
		</div>
	);
}
