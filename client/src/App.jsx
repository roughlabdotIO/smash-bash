import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import TorneoPage from './pages/TorneoPage.jsx';
import MasaModePage from './pages/MasaModePage.jsx';
import RankingPage from './pages/RankingPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/torneo" element={<TorneoPage />} />
        <Route path="/masa-mode" element={<MasaModePage />} />
        <Route path="/ranking" element={<RankingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
