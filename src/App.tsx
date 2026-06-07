import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AqiPage from './feature/aqi/AqiPage';
import SolarPage from './feature/solar/SolarPage';
import WaterPage from './feature/water/WaterPage';

// dei poda
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/aqi" element={<AqiPage />} />
        <Route path="/solar" element={<SolarPage />} />
        <Route path="/water" element={<WaterPage />} />
      </Routes>
    </Router>
  );
}

export default App;

