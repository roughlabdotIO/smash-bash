import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  drawFase1Pairs,
  drawFase1Gironi,
  drawFase1Matches,
  resetFase1,
  drawFase2Pairs,
  drawFase2Gironi,
  drawFase2Matches,
  resetFase2,
  drawFinalePairs,
  drawFinaleSemifinals,
  drawFinaleTiebreak,
  resetFinale,
  drawIquitPairs,
  drawIquitMatches,
  drawIquitPairsBatch2,
  drawIquitMatchesBatch2,
  resetIquit,
} from '../api.js';
import { useTournament } from '../hooks/useTournament.js';
import PhaseSection from '../components/PhaseSection.jsx';
import PhaseRecapSection from '../components/PhaseRecapSection.jsx';
import FinaleSection from '../components/FinaleSection.jsx';
import IquitChampSection from '../components/IquitChampSection.jsx';

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

  const recapFase1Ready = state.standings?.ready;
  const recapFase2Ready = state.standingsFase2?.ready;
  const finaleUnlocked = recapFase2Ready;
  const iquitBatch2Unlocked = recapFase2Ready && state.iquit.matchesDrawn;

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
            <>
              <PhaseSection
                phaseNum={1}
                title="Fase 1 — Gironi e rotazione"
                state={state.fase1}
                busy={busy}
                onDrawPairs={() => runAction(drawFase1Pairs)}
                onDrawGironi={() => runAction(drawFase1Gironi)}
                onDrawMatches={() => runAction(drawFase1Matches)}
                onReset={() => runAction(resetFase1)}
                resetLabel="Reset Fase 1"
              />

              <PhaseRecapSection
                standings={state.standings}
                title="Recap Fase 1 — Classifica"
                note="Punti totali segnati da ogni giocatore nella fase (non la differenza reti). In rosso i 4 eliminati per squadra."
              />

              <PhaseSection
                phaseNum={2}
                title="Fase 2 — Secondo girone"
                note="Solo i giocatori non eliminati in Fase 1."
                rules={[
                  'Rimescolamento generale: nuove coppie miste estratte a sorteggio per ogni squadra.',
                  'Nessuna coppia può ripetersi rispetto alla Fase 1 (stesso uomo con la stessa donna).',
                  'Rotazione Black: chi era nel Girone A in Fase 1 passa al Girone B (e viceversa).',
                  'Yellow: tutte le coppie si mescolano tra i due gironi.',
                ]}
                state={state.fase2}
                busy={busy}
                locked={!recapFase1Ready}
                lockedMessage="Inserisci tutti i risultati della Fase 1 per sbloccare la Fase 2."
                drawPairsLabel="Rimescola ed estrai coppie"
                drawGironiLabel="Estrai gironi (rotazione Black)"
                pairsBlockTitle="Nuove coppie rimescolate"
                showRotation
                onDrawPairs={() => runAction(drawFase2Pairs)}
                onDrawGironi={() => runAction(drawFase2Gironi)}
                onDrawMatches={() => runAction(drawFase2Matches)}
                onReset={() => runAction(resetFase2)}
                resetLabel="Reset Fase 2"
              />

              <PhaseRecapSection
                standings={state.standingsFase2}
                title="Recap Fase 2 — Classifica"
                note="Punti totali segnati nella fase (non la differenza reti). Altri 4 eliminati per squadra."
                elimNote="Gli eliminati di Fase 2 si uniscono all'iQuit Champ in corso."
              />

              <FinaleSection
                finale={state.finale}
                busy={busy}
                locked={!finaleUnlocked}
                lockedMessage="Inserisci tutti i risultati della Fase 2 per avviare la finale."
                onDrawPairs={() => runAction(drawFinalePairs)}
                onDrawSemifinals={() => runAction(drawFinaleSemifinals)}
                onDrawTiebreak={() => runAction(drawFinaleTiebreak)}
                onReset={() => runAction(resetFinale)}
              />

              <IquitChampSection
                iquit={state.iquit}
                busy={busy}
                locked={!recapFase1Ready || !state.fase2.gironiDrawn}
                lockedMessage="Estrai prima i gironi della Fase 2 per avviare l'iQuit Champ."
                batch2Locked={!iquitBatch2Unlocked}
                batch2LockedMessage="Completa i risultati Fase 2 e avvia il primo turno iQuit prima di aggiungere gli eliminati di Fase 2."
                onDrawPairs={() => runAction(drawIquitPairs)}
                onDrawMatches={() => runAction(drawIquitMatches)}
                onDrawPairsBatch2={() => runAction(drawIquitPairsBatch2)}
                onDrawMatchesBatch2={() => runAction(drawIquitMatchesBatch2)}
                onReset={() => runAction(resetIquit)}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
