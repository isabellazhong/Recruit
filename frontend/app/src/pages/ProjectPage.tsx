import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Monitor, 
  PenTool, 
  Sun, 
  Settings2, 
  Zap, 
  Calendar, 
  CloudSun,
  ArrowLeft
} from 'lucide-react';
import '../App.css';

type ViewType = 'desk' | 'whiteboard' | 'window';

interface ImmersiveHomeProps {
  onBack: () => void;
}

export default function ImmersiveHome({ onBack }: ImmersiveHomeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<ViewType>('desk');
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

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

  // --- Clock Effect ---
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
        </div>
      </div>
    </div>
  );
}