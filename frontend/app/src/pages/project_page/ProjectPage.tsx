import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import * as THREE from 'three';
import "./ProjectPage.css";
import { uploadOriginalResume, updateLatestJobDescription } from '../../api/projects';
import { 
  Monitor, 
  PenTool, 
  Sun, 
  Settings2, 
  ArrowLeft,
  Upload,
  FileText,
  Download,
  Sparkles,
  CheckCircle2,
  XCircle
} from 'lucide-react';

type ViewType = 'desk' | 'whiteboard' | 'window';

interface ProjectPageProps {
  onBack: () => void;
}

interface ResumeExperience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface ResumeEducation {
  degree: string;
  school: string;
  year: string;
}

interface ResumeData {
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

function ResumeUpload({ resumeData, jobDescription, onResumeUpdate, onJobDescriptionUpdate }: ResumeUploadProps) {
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

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadOriginalResume(file);

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
      showToast(`Uploaded ${file.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload resume';
      showToast(message, 'error');
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
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

  const convertToLatex = async () => {
    if (!resumeData) {
      showToast('Please upload a resume first', 'error');
      return;
    }

    setConverting(true);
    try {
      const trimmedDesc = jobDescription.trim();
      if (trimmedDesc) {
        await updateLatestJobDescription(trimmedDesc);
        showToast('Job description saved');
      }

      const latex = generateLatexResume(resumeData, jobDescription);
      setLatexCode(latex);
      showToast('Converted to LaTeX');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save job description';
      showToast(message, 'error');
    } finally {
      setConverting(false);
    }
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

export default function ProjectPage({ onBack }: ProjectPageProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<ViewType>('desk');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [jobDescription, setJobDescription] = useState('');

  // Refs for 3D objects to access inside the animation loop without dependencies
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const targetsRef = useRef<{
    targetPos: THREE.Vector3;
    targetLook: THREE.Vector3;
    currentLook: THREE.Vector3;
  } | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // View Definitions
  const views: Record<ViewType, { title: string; pos: THREE.Vector3; look: THREE.Vector3 }> = {
    desk: { 
      title: "My Workstation", 
      pos: new THREE.Vector3(0, 6, 14), 
      look: new THREE.Vector3(0, 2, 0) 
    },
    whiteboard: { 
      title: "Brainstorming", 
      pos: new THREE.Vector3(5, 5, 10), 
      look: new THREE.Vector3(-15, 5, 0) 
    },
    window: { 
      title: "View Outside", 
      pos: new THREE.Vector3(-5, 5, 10), 
      look: new THREE.Vector3(15, 6, 0) 
    }
  };

  // --- View Change Effect ---
  useEffect(() => {
    if (targetsRef.current) {
      const v = views[activeView];
      targetsRef.current.targetPos.copy(v.pos);
      targetsRef.current.targetLook.copy(v.look);
    }
  }, [activeView]);

  // --- Three.js Initialization ---
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f7);
    scene.fog = new THREE.Fog(0xf5f5f7, 10, 60);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;
    
    // Set initial position based on default state
    const initialView = views.desk;
    camera.position.copy(initialView.pos);
    camera.lookAt(initialView.look);
    
    // Initialize target refs
    targetsRef.current = {
      targetPos: initialView.pos.clone(),
      targetLook: initialView.look.clone(),
      currentLook: initialView.look.clone()
    };

    const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    mountRef.current.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);

    const windowLight = new THREE.DirectionalLight(0xd0e0ff, 0.5);
    windowLight.position.set(20, 5, 0);
    scene.add(windowLight);

    // 3. Materials
    const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const matFloor = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2 });
    const matWood = new THREE.MeshStandardMaterial({ color: 0xe0d0c0, roughness: 0.6 });
    const matGlass = new THREE.MeshPhongMaterial({ color: 0xd0e0ff, opacity: 0.3, transparent: true, shininess: 90 });
    const matAccent = new THREE.MeshStandardMaterial({ color: 0xff9500 });
    const matPlant = new THREE.MeshStandardMaterial({ color: 0x34c759 });
    const matBlue = new THREE.MeshStandardMaterial({ color: 0x007aff });

    // 4. Geometry Helpers
    const createBox = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, ry=0, shadow=true) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, y, z);
        mesh.rotation.y = ry;
        if(shadow) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }
        return mesh;
    };

    // 5. Build Room
    const roomGroup = new THREE.Group();
    
    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), matFloor);
    floor.rotation.x = -Math.PI/2;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Walls
    const wallH = 15;
    const wallW = 40;
    roomGroup.add(createBox(wallW, wallH, 1, matWhite, 0, wallH/2, -10, 0, false)); // Back
    roomGroup.add(createBox(1, wallH, wallW, matWhite, -20, wallH/2, 0, 0, false)); // Left
    roomGroup.add(createBox(1, wallH, wallW, matWhite, 20, wallH/2, 0, 0, false)); // Right

    // Desk Group
    const deskGroup = new THREE.Group();
    deskGroup.add(createBox(14, 0.5, 6, matWhite, 0, 3, 0)); // Top
    deskGroup.add(createBox(0.5, 3, 5, matWood, -6, 1.5, 0)); // Legs
    deskGroup.add(createBox(0.5, 3, 5, matWood, 6, 1.5, 0));
    deskGroup.add(createBox(6, 3.5, 0.2, matDark, 0, 5, -2)); // Monitor
    deskGroup.add(createBox(1, 2, 0.2, matDark, 0, 4, -2.2)); // Stand
    deskGroup.add(createBox(3, 0.1, 1, matDark, 0, 3.3, 1)); // Keyboard
    deskGroup.add(createBox(0.5, 0.1, 0.8, matDark, 2.5, 3.3, 1)); // Mouse
    deskGroup.add(createBox(0.5, 4, 0.5, matAccent, -5, 5, -2)); // Lamp Stem
    deskGroup.add(createBox(2, 1, 2, matAccent, -4, 6.5, -1)); // Lamp Shade
    
    // Chair
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, 4);
    chairGroup.rotation.y = -0.2;
    chairGroup.add(createBox(3, 0.5, 3, matDark, 0, 2, 0));
    chairGroup.add(createBox(3, 4, 0.5, matDark, 0, 4, 1.5));
    chairGroup.add(createBox(0.5, 2, 0.5, matDark, 0, 1, 0));
    deskGroup.add(chairGroup);
    roomGroup.add(deskGroup);

    // Whiteboard Group
    const boardGroup = new THREE.Group();
    boardGroup.position.set(-19, 5, 0);
    boardGroup.rotation.y = Math.PI / 2;
    boardGroup.add(createBox(12, 6, 0.2, matDark, 0, 0, 0)); // Frame
    boardGroup.add(createBox(11.5, 5.5, 0.3, matWhite, 0, 0, 0.1)); // Surface
    boardGroup.add(createBox(8, 0.2, 1, matDark, 0, -2.8, 0.5)); // Tray
    boardGroup.add(createBox(1, 1, 0.01, matAccent, -2, 1, 0.3)); // Post-it
    boardGroup.add(createBox(1, 1, 0.01, matPlant, 0, 0, 0.3)); // Post-it
    boardGroup.add(createBox(1, 1, 0.01, matBlue, 2, 2, 0.3)); // Post-it
    roomGroup.add(boardGroup);

    // Window Group
    const windowGroup = new THREE.Group();
    windowGroup.position.set(19.5, 6, 0);
    windowGroup.rotation.y = -Math.PI / 2;
    windowGroup.add(createBox(10, 8, 0.5, matDark, 0, 0, 0)); // Frame
    windowGroup.add(createBox(9, 7, 0.2, matGlass, 0, 0, 0)); // Glass
    
    const skyGeo = new THREE.PlaneGeometry(20, 20);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x87ceeb });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.position.set(0, 0, -2);
    sky.rotation.y = Math.PI;
    windowGroup.add(sky);
    
    // Cloud
    const cloud = new THREE.Group();
    cloud.add(createBox(3, 1, 1, matWhite, 2, 2, -1, 0, false));
    cloud.add(createBox(2, 1.5, 1, matWhite, 1, 2.5, -1, 0, false));
    windowGroup.add(cloud);
    roomGroup.add(windowGroup);

    // Plant Group
    const plantGroup = new THREE.Group();
    plantGroup.position.set(15, 0, -8);
    plantGroup.add(createBox(2, 2, 2, matWhite, 0, 1, 0));
    plantGroup.add(createBox(0.2, 6, 0.2, matPlant, 0, 4, 0));
    plantGroup.add(createBox(2, 1, 0.1, matPlant, 0.5, 5, 0, 0.5));
    plantGroup.add(createBox(2, 1, 0.1, matPlant, -0.5, 6, 0, -0.5));
    roomGroup.add(plantGroup);

    scene.add(roomGroup);

    // 6. Animation Logic
    const animate = () => {
        requestAnimationFrame(animate);

        if (targetsRef.current && cameraRef.current) {
            // Lerp Camera Position
            cameraRef.current.position.lerp(targetsRef.current.targetPos, 0.05);
            
            // Lerp LookAt Vector
            targetsRef.current.currentLook.lerp(targetsRef.current.targetLook, 0.05);
            
            // Apply Mouse Parallax
            const parallaxX = mouseRef.current.x * 5;
            const parallaxY = mouseRef.current.y * 5;
            
            cameraRef.current.lookAt(
                targetsRef.current.currentLook.x + parallaxX,
                targetsRef.current.currentLook.y - parallaxY,
                targetsRef.current.currentLook.z
            );
        }

        renderer.render(scene, cameraRef.current!);
    };
    animate();

    // 7. Event Listeners
    const handleResize = () => {
        if (cameraRef.current) {
            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
        }
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const handleMouseMove = (e: MouseEvent) => {
        mouseRef.current = {
            x: (e.clientX - window.innerWidth / 2) * 0.0005,
            y: (e.clientY - window.innerHeight / 2) * 0.0005
        };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        if (mountRef.current) {
            mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
    };
  }, []); // Run once on mount

  return (
    <div className="ih-container">
      {/* 3D Canvas Layer */}
      <div ref={mountRef} className="ih-canvas-layer" />

      {/* UI Overlay Layer */}
      <div className="ih-ui-layer">
        
        {/* Main Grid */}
        <div className="ih-grid">
            
          {/* Sidebar */}
          <aside className="ih-sidebar">
            <button onClick={onBack} className="ih-back-btn" title="Back to Menu">
              <ArrowLeft size={20} />
            </button>

            <div className="ih-logo">A</div>
                
            <button 
              onClick={() => setActiveView('desk')} 
              className={`ih-btn ${activeView === 'desk' ? 'active' : ''}`}
            >
              <Monitor size={24} />
              <span className="ih-label">Desk View</span>
            </button>
                
            <button 
              onClick={() => setActiveView('whiteboard')} 
              className={`ih-btn ${activeView === 'whiteboard' ? 'active' : ''}`}
            >
              <PenTool size={24} />
              <span className="ih-label">Whiteboard</span>
            </button>
                
            <button 
              onClick={() => setActiveView('window')} 
              className={`ih-btn ${activeView === 'window' ? 'active' : ''}`}
            >
              <Sun size={24} />
              <span className="ih-label">Window View</span>
            </button>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <button className="ih-btn">
                <Settings2 size={20} />
              </button>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="ih-profile" />
            </div>
          </aside>

          <main className="ih-main">
            {activeView === 'whiteboard' ? (
              <ResumeUpload 
                resumeData={resumeData}
                jobDescription={jobDescription}
                onResumeUpdate={setResumeData}
                onJobDescriptionUpdate={setJobDescription}
              />
            ) : (
              <div className="ih-placeholder">
                <div className="ih-placeholder-content">
                  <h2>{views[activeView].title}</h2>
                  <p>
                    {activeView === 'desk' && 'Resume optimization in progress. Hop over to the whiteboard to upload your latest draft.'}
                    {activeView === 'window' && 'Enjoy the view while your workspace stays in sync. Switch back to the whiteboard when you are ready to edit.'}
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}