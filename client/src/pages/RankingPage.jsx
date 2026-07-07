import { Link } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament.js';
import StandingsPanel from '../components/StandingsPanel.jsx';

export default function RankingPage() {
  const { state, loading, error } = useTournament();
  const { ranking } = state;

  return (
    <div className="torneo-page ranking-page">
      <header className="torneo-page-header">
        <div className="wrap">
          <Link to="/" className="torneo-back-link">
            ← Torna alla landing
          </Link>
          <h1 className="torneo-page-title">Classifica Live</h1>
          <p className="ranking-subtitle">Punti aggiornati in tempo reale durante il torneo</p>
        </div>
      </header>

      <main className="torneo-page-main">
        <div className="wrap">
          {loading && <p className="torneo-status">Caricamento…</p>}
          {error && <p className="torneo-status err">{error}</p>}

          {!loading && (
            <div className="ranking-sections">
              <StandingsPanel
                standings={ranking?.fase1}
                title="Fase 1"
                note="Punti totali segnati nella fase (somma dei punti fatti dal proprio team in ogni match). Gli eliminati compaiono in rosso a fine fase."
              />
              <StandingsPanel
                standings={ranking?.fase2}
                title="Fase 2"
                note="Secondo girone: solo i giocatori non eliminati in Fase 1. Punti totali segnati nella fase (somma punti fatti dal proprio team)."
                elimNote="Gli eliminati di Fase 2 si uniscono all'iQuit Champ in corso."
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
