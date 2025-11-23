import { useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Plus } from "lucide-react";
import { ProjectPanel } from "../../components/home_page/ProjectPanel";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import { UploadProject } from "../../components/home_page/UploadProjectPanel";
import { CreateProjectPanel } from "../../components/home_page/CreateProjectPanel";

type Project = {
	id: number;
	title: string;
	role: string;
	lastUpdated: string;
	jobDescriptionName?: string;
};

const INITIAL_PROJECTS: Project[] = [];

interface HomePageProps {
	jobDescription: string;
	setJobDescription: Dispatch<SetStateAction<string>>;
}

export default function HomePage({ jobDescription, setJobDescription }: HomePageProps) {
	const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [projectTitle, setProjectTitle] = useState("");
    const navigate = useNavigate(); 
    const openWorkspace = () => navigate('/workspace'); 


	const handleCreateProject = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!projectTitle.trim() || !jobDescription.trim()) return;

		const newProject: Project = {
			id: Date.now(),
			title: projectTitle.trim(),
			role: "Custom role",
			lastUpdated: "Just now",
			jobDescriptionName: jobDescription.trim().slice(0, 40),
		};

		setProjects((prev) => [newProject, ...prev]);
		setProjectTitle("");
		setJobDescription("");
		setIsModalOpen(false);
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
					jobDescription={jobDescription}
					setJobDescription={setJobDescription}
				/>
			)}
		</div>
	);
}
