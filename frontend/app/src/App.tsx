import { Routes, Route, useNavigate } from "react-router-dom";
import './App.css'
import LandingPage from "./pages/landing_page/LandingPage";
import HomePage from "./pages/home_page/HomePage";
import ProjectPage from "./pages/project_page/ProjectPage";


function App() {
  const navigator = useNavigate();
  const goBack = () => navigator('/home');
  
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/workspace" element={<ProjectPage onBack={goBack}/>} />
    </Routes>
  )
  
}

export default App