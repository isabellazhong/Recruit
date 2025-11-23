import { useState } from 'react';
import { Routes, Route, useNavigate } from "react-router-dom";
import './App.css'
import LandingPage from "./pages/landing_page/LandingPage";
import HomePage from "./pages/home_page/HomePage";
import ProjectPage from "./pages/project_page/ProjectPage";


function App() {
  const navigator = useNavigate();
  const [jobDescription, setJobDescription] = useState('');
  const goBack = () => navigator('/home');
  
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/home"
        element={<HomePage jobDescription={jobDescription} setJobDescription={setJobDescription} />}
      />
      <Route
        path="/workspace"
        element={
          <ProjectPage
            onBack={goBack}
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
          />
        }
      />
    </Routes>
  )
  
}

export default App