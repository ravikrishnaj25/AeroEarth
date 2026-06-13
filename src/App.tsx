import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AqiPage from './feature/aqi/AqiPage';
import SolarPage from './feature/solar/SolarPage';
import WaterPage from './feature/water/WaterPage';
import AgentMonitorPage from './feature/agent/AgentMonitorPage';

// dei poda
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/aqi" element={<AqiPage />} />
        <Route path="/solar" element={<SolarPage />} />
        <Route path="/water" element={<WaterPage />} />
        <Route path="/agent-monitor" element={<AgentMonitorPage />} />
      </Routes>
    </Router>
  );
}

export default App;


