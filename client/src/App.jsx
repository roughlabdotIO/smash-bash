import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import TorneoPage from './pages/TorneoPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/torneo" element={<TorneoPage />} />
      </Routes>
    </BrowserRouter>
  );
}
