import { UploadCloud, FileText, X } from "lucide-react";
import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import "../../pages/home_page/HomePage.css";

interface CreateProjectProps {
	onClose: () => void;
	onSubmit: FormEventHandler<HTMLFormElement>;
	currProjectTitle: string;
	setTitle: Dispatch<SetStateAction<string>>;
	jobFile: File | null;
	setJobFile: Dispatch<SetStateAction<File | null>>;
}

export function CreateProjectPanel({
	onClose,
	onSubmit,
	currProjectTitle,
	setTitle,
	jobFile,
	setJobFile,
}: CreateProjectProps) {
    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
					<div className="modal">
						<header className="modal-header">
							<div>
								<p className="eyebrow">New project</p>
								<h3>Upload job description</h3>
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

							<label className="input-label">Job description</label>
							<label className="upload-zone">
								<UploadCloud size={24} />
								<p>
									Drag & drop the file, or <span>browse</span>
								</p>
								<p className="upload-hint">PDF, DOCX, or TXT up to 5MB</p>
								<input
									type="file"
									accept=".pdf,.doc,.docx,.txt"
									onChange={(event) => setJobFile(event.target.files?.[0] ?? null)}
									required
								/>
								{jobFile && (
									<div className="upload-summary">
										<FileText size={16} />
										<div>
											<strong>{jobFile.name}</strong>
											<span>{(jobFile.size / 1024).toFixed(0)} KB</span>
										</div>
									</div>
								)}
							</label>

							<div className="modal-actions">
								<button type="button" className="secondary-btn" onClick={onClose}>
									Cancel
								</button>
								<button type="submit" className="primary-btn" disabled={!currProjectTitle.trim() || !jobFile}>
									Create project
								</button>
							</div>
						</form>
					</div>
				</div>
    );
}