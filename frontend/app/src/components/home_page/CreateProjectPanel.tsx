import { FileText, X } from "lucide-react";
import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import "../../pages/home_page/HomePage.css";

interface CreateProjectProps {
	onClose: () => void;
	onSubmit: FormEventHandler<HTMLFormElement>;
	currProjectTitle: string;
	setTitle: Dispatch<SetStateAction<string>>;
	jobDescription: string;
	setJobDescription: Dispatch<SetStateAction<string>>;
}

export function CreateProjectPanel({
	onClose,
	onSubmit,
	currProjectTitle,
	setTitle,
	jobDescription,
	setJobDescription,
}: CreateProjectProps) {
    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
					<div className="modal">
						<header className="modal-header">
							<div>
								<p className="eyebrow">New project</p>
								<h3>Add job description</h3>
							</div>
							<button className="icon-btn" onClick={onClose} aria-label="Close">
								<X size={18} />
							</button>
						</header>

						<form className="modal-form" onSubmit={onSubmit}>
							<label className="input-label" htmlFor="project-title">
								Project title
							</label>
							<input
								id="project-title"
								type="text"
								placeholder="e.g., Infra leadership loop"
								value={currProjectTitle}
								onChange={(e) => setTitle(e.target.value)}
								required
							/>

							<label className="input-label" htmlFor="job-description">
								Job description
							</label>
							<div className="text-area-wrapper">
								<FileText size={18} />
								<textarea
									id="job-description"
									placeholder="Paste the role overview, requirements, and responsibilities."
									value={jobDescription}
									onChange={(event) => setJobDescription(event.target.value)}
									rows={6}
									required
								/>
							</div>

							<div className="modal-actions">
								<button type="button" className="secondary-btn" onClick={onClose}>
									Cancel
								</button>
								<button type="submit" className="primary-btn" disabled={!currProjectTitle.trim() || !jobDescription.trim()}>
									Create project
								</button>
							</div>
						</form>
					</div>
				</div>
    );
}