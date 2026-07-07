import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  drawFase1Pairs,
  drawFase1Gironi,
  drawFase1Matches,
  resetFase1,
} from '../api.js';
import { useTournament } from '../hooks/useTournament.js';
import Fase1Section from '../components/Fase1Section.jsx';

export default function TorneoPage() {
  const { state, loading, error } = useTournament();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  async function runAction(fn) {
    setBusy(true);
    setActionError('');
    try {
      await fn();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="torneo-page">
      <header className="torneo-page-header">
        <div className="wrap">
          <Link to="/" className="torneo-back-link">
            ← Torna alla landing
          </Link>
          <h1 className="torneo-page-title">Smash Bash — Live</h1>
        </div>
      </header>

      <main className="torneo-page-main">
        <div className="wrap">
          {loading && <p className="torneo-status">Caricamento…</p>}
          {error && <p className="torneo-status err">{error}</p>}
          {actionError && <p className="torneo-status err">{actionError}</p>}

          {!loading && (
            <Fase1Section
              state={state}
              busy={busy}
              onDrawPairs={() => runAction(drawFase1Pairs)}
              onDrawGironi={() => runAction(drawFase1Gironi)}
              onDrawMatches={() => runAction(drawFase1Matches)}
              onReset={() => runAction(resetFase1)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
