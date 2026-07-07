import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { updateMatchResult, updateIquitMatchResult } from '../api.js';
import { useTournament } from '../hooks/useTournament.js';
import StandingsPanel from '../components/StandingsPanel.jsx';

function MatchResultForm({ match, label, onSaved, busy, setBusy, setError }) {
  const [blackScore, setBlackScore] = useState(
    match.blackScore !== null ? String(match.blackScore) : ''
  );
  const [yellowScore, setYellowScore] = useState(
    match.yellowScore !== null ? String(match.yellowScore) : ''
  );

  useEffect(() => {
    setBlackScore(match.blackScore !== null ? String(match.blackScore) : '');
    setYellowScore(match.yellowScore !== null ? String(match.yellowScore) : '');
  }, [match.blackScore, match.yellowScore, match.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await updateMatchResult(match.id, Number(blackScore), Number(yellowScore));
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="masa-match-card" onSubmit={handleSubmit}>
      <div className="masa-match-head">
        <span className="masa-match-girone">
          {label || (match.girone ? `Girone ${match.girone}` : 'Match')}
        </span>
        {match.completed && <span className="masa-match-done">Registrato</span>}
      </div>
      <div className="masa-match-teams">
        <div className="masa-match-team black">
          <span className="masa-team-label">Black</span>
          <span className="masa-pair-name">{match.blackPair.label}</span>
        </div>
        <span className="masa-match-vs">vs</span>
        <div className="masa-match-team yellow">
          <span className="masa-team-label">Yellow</span>
          <span className="masa-pair-name">{match.yellowPair.label}</span>
        </div>
      </div>
      <div className="masa-score-row">
        <label>
          <span>Punti Black</span>
          <input
            type="number"
            min={0}
            max={99}
            value={blackScore}
            disabled={busy}
            onChange={(e) => setBlackScore(e.target.value)}
          />
        </label>
        <label>
          <span>Punti Yellow</span>
          <input
            type="number"
            min={0}
            max={99}
            value={yellowScore}
            disabled={busy}
            onChange={(e) => setYellowScore(e.target.value)}
          />
        </label>
        <button type="submit" className="masa-save-btn" disabled={busy}>
          Salva
        </button>
      </div>
    </form>
  );
}

function IquitMatchResultForm({ match, canEdit, onSaved, busy, setBusy, setError }) {
  const [blackScore, setBlackScore] = useState(
    match.blackScore !== null ? String(match.blackScore) : ''
  );
  const [yellowScore, setYellowScore] = useState(
    match.yellowScore !== null ? String(match.yellowScore) : ''
  );

  useEffect(() => {
    setBlackScore(match.blackScore !== null ? String(match.blackScore) : '');
    setYellowScore(match.yellowScore !== null ? String(match.yellowScore) : '');
  }, [match.blackScore, match.yellowScore, match.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await updateIquitMatchResult(match.id, Number(blackScore), Number(yellowScore));
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!match.ready) {
    return (
      <div className="masa-match-card masa-match-card--wait">
        <div className="masa-match-head">
          <span className="masa-match-girone">Match {match.sequence}</span>
        </div>
        <p className="masa-wait-msg">In attesa del match precedente</p>
      </div>
    );
  }

  return (
    <form className="masa-match-card masa-match-card--iquit" onSubmit={handleSubmit}>
      <div className="masa-match-head">
        <span className="masa-match-girone">Match {match.sequence}</span>
        {match.isKingOfCourt && <span className="iquit-king-pill">Chi vince resta</span>}
        {match.completed && <span className="masa-match-done">Registrato</span>}
      </div>
      <div className="masa-match-teams">
        <div className="masa-match-team black">
          <span className="masa-team-label">Black</span>
          <span className="masa-pair-name">{match.blackPair?.label}</span>
        </div>
        <span className="masa-match-vs">vs</span>
        <div className="masa-match-team yellow">
          <span className="masa-team-label">Yellow</span>
          <span className="masa-pair-name">{match.yellowPair?.label}</span>
        </div>
      </div>
      <div className="masa-score-row">
        <label>
          <span>Punti Black</span>
          <input
            type="number"
            min={0}
            max={99}
            value={blackScore}
            disabled={busy || !canEdit}
            onChange={(e) => setBlackScore(e.target.value)}
          />
        </label>
        <label>
          <span>Punti Yellow</span>
          <input
            type="number"
            min={0}
            max={99}
            value={yellowScore}
            disabled={busy || !canEdit}
            onChange={(e) => setYellowScore(e.target.value)}
          />
        </label>
        <button type="submit" className="masa-save-btn" disabled={busy || !canEdit}>
          Salva
        </button>
      </div>
    </form>
  );
}

function canEditIquitMatch(matches, match) {
  if (!match.ready || match.completed) return false;
  if (match.sequence === 1) return true;
  const prev = matches.find((m) => m.sequence === match.sequence - 1);
  return prev?.completed;
}

export default function MasaModePage() {
  const { state, loading, error, refresh } = useTournament();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const hasMatches =
    state.fase1.matchesDrawn ||
    state.fase2.matchesDrawn ||
    state.finale.matchesDrawn ||
    state.iquit.matchesDrawn;
  const formProps = { busy, setBusy, setError: setActionError, onSaved: refresh };

  return (
    <div className="torneo-page masa-page">
      <header className="torneo-page-header">
        <div className="wrap">
          <Link to="/torneo" className="torneo-back-link">
            ← Torna al torneo live
          </Link>
          <h1 className="torneo-page-title">Masa Mode</h1>
          <p className="masa-subtitle">Aggiornamento risultati match</p>
        </div>
      </header>

      <main className="torneo-page-main">
        <div className="wrap masa-layout-wrap">
          {loading && <p className="torneo-status">Caricamento…</p>}
          {error && <p className="torneo-status err">{error}</p>}
          {actionError && <p className="torneo-status err">{actionError}</p>}

          {!loading && (
            <div className="masa-layout">
              <aside className="masa-standings-sidebar" aria-label="Classifica live">
                <div className="masa-standings-sticky">
                  <h2 className="masa-standings-heading">Classifica</h2>
                  <StandingsPanel
                    standings={state.ranking?.fase1}
                    title="Fase 1"
                    compact
                  />
                  <StandingsPanel
                    standings={state.ranking?.fase2}
                    title="Fase 2"
                    compact
                  />
                </div>
              </aside>

              <div className="masa-content">
                {!hasMatches && (
                  <p className="torneo-status">
                    Nessun match sorteggiato. Vai su{' '}
                    <Link to="/torneo" className="masa-inline-link">
                      /torneo
                    </Link>{' '}
                    e completa il sorteggio.
                  </p>
                )}

                {hasMatches && (
                  <>
              {state.fase1.matchesDrawn && (
                <div className="masa-phase-block">
                  <h2 className="masa-phase-title">Fase 1</h2>
                  <div className="masa-matches-grid">
                    {[...state.fase1.gironeA.matches, ...state.fase1.gironeB.matches].map(
                      (match) => (
                        <MatchResultForm key={match.id} match={match} {...formProps} />
                      )
                    )}
                  </div>
                </div>
              )}

              {state.fase2.matchesDrawn && (
                <div className="masa-phase-block">
                  <h2 className="masa-phase-title">Fase 2</h2>
                  <div className="masa-matches-grid">
                    {[...state.fase2.gironeA.matches, ...state.fase2.gironeB.matches].map(
                      (match) => (
                        <MatchResultForm key={match.id} match={match} {...formProps} />
                      )
                    )}
                  </div>
                </div>
              )}

              {state.finale.matchesDrawn && (
                <div className="masa-phase-block">
                  <h2 className="masa-phase-title">Fase 3</h2>
                  <div className="masa-matches-grid">
                    {[...state.finale.gironeA.matches, ...state.finale.gironeB.matches].map(
                      (match) => (
                        <MatchResultForm key={match.id} match={match} {...formProps} />
                      )
                    )}
                  </div>
                </div>
              )}

              {state.iquit.matchesDrawn && (
                <div className="masa-phase-block">
                  <h2 className="masa-phase-title">iQuit Champ</h2>
                  {state.iquit.courtHolder && (
                    <p className="iquit-court-holder masa-court-holder">
                      Detentore campo: <strong>{state.iquit.courtHolder.label}</strong>
                    </p>
                  )}
                  <div className="masa-matches-grid">
                    {state.iquit.matches.map((match) => (
                      <IquitMatchResultForm
                        key={match.id}
                        match={match}
                        matches={state.iquit.matches}
                        canEdit={canEditIquitMatch(state.iquit.matches, match)}
                        {...formProps}
                      />
                    ))}
                  </div>
                </div>
              )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
