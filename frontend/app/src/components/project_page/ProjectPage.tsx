import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import "../../pages/project_page/ProjectPage.css";
import { 
  Upload,
  FileText,
  Download,
  Sparkles,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export interface ResumeExperience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface ResumeEducation {
  degree: string;
  school: string;
  year: string;
}

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
}

interface ResumeUploadProps {
  resumeData: ResumeData | null;
  jobDescription: string;
  onResumeUpdate: (data: ResumeData) => void;
  onJobDescriptionUpdate: (value: string) => void;
}

type ToastState = { message: string; type: 'success' | 'error' } | null;

function Toast({ state }: { state: ToastState }) {
  if (!state) return null;
  return (
    <div className={`ih-toast ${state.type === 'success' ? 'ih-toast-success' : 'ih-toast-error'}`}>
      {state.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      <span>{state.message}</span>
    </div>
  );
}

export function ResumeUpload({ resumeData, jobDescription, onResumeUpdate, onJobDescriptionUpdate }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [latexCode, setLatexCode] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [toast, setToast] = useState<ToastState>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setTimeout(() => {
      const mockResumeData: ResumeData = {
        name: 'Alex Developer',
        email: 'alex.dev@email.com',
        phone: '(555) 123-4567',
        summary: 'Creative Software Engineer passionate about 3D web experiences and React.',
        experience: [
          {
            title: 'Frontend Developer',
            company: 'Creative Tech Labs',
            duration: '2022 - Present',
            description: 'Spearheaded the migration to React 18 and implemented 3D visualizations using Three.js.'
          },
          {
            title: 'Junior Web Dev',
            company: 'StartUp Inc',
            duration: '2020 - 2022',
            description: 'Built responsive UI components and optimized load times by 40%.'
          }
        ],
        education: [
          {
            degree: 'BS Computer Science',
            school: 'Tech University',
            year: '2020'
          }
        ],
        skills: ['JavaScript', 'TypeScript', 'React', 'Three.js', 'Tailwind CSS', 'Node.js']
      };

      onResumeUpdate(mockResumeData);
      setUploading(false);
      showToast(`Uploaded ${file.name}`);
    }, 1500);
  };

  const generateLatexResume = (data: ResumeData, desc: string) => {
    const text = desc || '';
    const emphasizeSkills = text.toLowerCase().includes('react') || text.toLowerCase().includes('frontend');

    return `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\begin{document}

\\begin{center}
\\textbf{\\Large ${data.name}}\\\\
\\vspace{2mm}
${data.email} | ${data.phone}
\\end{center}

\\section*{Summary}
${data.summary}${text ? ' (Tailored for: ' + text.substring(0, 30) + '...)' : ''}

\\section*{Professional Experience}
${data.experience.map(exp => `
\\textbf{${exp.title}} \\hfill ${exp.duration}\\\\
\\textit{${exp.company}}\\\\
${exp.description}
`).join('\n')}

\\section*{Education}
${data.education.map(edu => `
\\textbf{${edu.degree}} \\hfill ${edu.year}\\\\
${edu.school}
`).join('\n')}

\\section*{Technical Skills}
${emphasizeSkills ? '\\textbf{Key Match: React, Three.js}\\\\' : ''}
${data.skills.join(' $\\bullet$ ')}

\\end{document}`;
  };

  const convertToLatex = () => {
    if (!resumeData) {
      showToast('Please upload a resume first', 'error');
      return;
    }

    setConverting(true);
    setTimeout(() => {
      const latex = generateLatexResume(resumeData, jobDescription);
      setLatexCode(latex);
      setConverting(false);
      showToast('Converted to LaTeX');
    }, 2000);
  };

  const downloadLatex = () => {
    if (!latexCode) {
      showToast('Nothing to download yet', 'error');
      return;
    }

    const blob = new Blob([latexCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resume.tex';
    link.click();
    URL.revokeObjectURL(url);
    showToast('LaTeX downloaded');
  };

  return (
    <div className="ih-resume-upload">
      <Toast state={toast} />
      <div className="ih-resume-grid">
        <section className="ih-card ih-card-column">
          <header className="ih-card-header">
            <div>
              <h3>Upload Resume</h3>
              <p>Import your current resume to get started.</p>
            </div>
          </header>
          <div className="ih-card-body">
            <div 
              className={`ih-dropzone ${uploading ? 'ih-dropzone-loading' : ''}`}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <div className="ih-dropzone-icon">
                <Upload size={28} />
              </div>
              <p>{uploading ? 'Processing file...' : 'Drag & drop or click to upload'}</p>
              <span>PDF, DOC, DOCX</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="ih-hidden-input"
                onChange={handleFileUpload}
              />
            </div>

            {resumeData && (
              <div className="ih-uploaded-pill">
                <FileText size={16} />
                <span>Uploaded: {resumeData.name}</span>
              </div>
            )}

            <label className="ih-field-label" htmlFor="ih-job-desc">Job Description (optional)</label>
            <textarea
              id="ih-job-desc"
              className="ih-textarea"
              placeholder="Paste the job description to tailor your resume..."
              value={jobDescription}
              onChange={(e) => onJobDescriptionUpdate(e.target.value)}
            />

            <button
              className="ih-primary-btn"
              onClick={convertToLatex}
              disabled={!resumeData || converting}
            >
              <Sparkles size={18} />
              <span>{converting ? 'Optimizing...' : 'Convert & Optimize'}</span>
            </button>
          </div>
        </section>

        <section className="ih-card ih-card-column">
          <header className="ih-card-header">
            <div>
              <h3>LaTeX Output</h3>
              <p>Preview or grab the raw LaTeX.</p>
            </div>
          </header>
          <div className="ih-card-body ih-card-body-stretch">
            {latexCode ? (
              <>
                <div className="ih-tab-group">
                  <button
                    className={`ih-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('preview')}
                  >
                    Preview
                  </button>
                  <button
                    className={`ih-tab-btn ${activeTab === 'code' ? 'active' : ''}`}
                    onClick={() => setActiveTab('code')}
                  >
                    LaTeX Code
                  </button>
                </div>
                <div className="ih-output-panel">
                  {activeTab === 'preview' && resumeData ? (
                    <div className="ih-preview-scroll">
                      <div className="ih-preview-header">
                        <h4>{resumeData.name}</h4>
                        <p>{resumeData.email} | {resumeData.phone}</p>
                      </div>
                      <div className="ih-preview-section">
                        <h5>Summary</h5>
                        <p>{resumeData.summary}</p>
                      </div>
                      <div className="ih-preview-section">
                        <h5>Experience</h5>
                        {resumeData.experience.map((exp, idx) => (
                          <div key={idx} className="ih-preview-experience">
                            <div>
                              <span className="ih-preview-title">{exp.title}</span>
                              <span className="ih-preview-duration">{exp.duration}</span>
                            </div>
                            <p className="ih-preview-company">{exp.company}</p>
                            <p>{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <pre className="ih-code-block">{latexCode}</pre>
                  )}
                </div>
                <button className="ih-outline-btn" onClick={downloadLatex}>
                  <Download size={18} />
                  <span>Download .tex</span>
                </button>
              </>
            ) : (
              <div className="ih-empty-state">
                <FileText size={32} />
                <h4>No output yet</h4>
                <p>Upload a resume and convert it to see the tailored LaTeX content.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
