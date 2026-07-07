import { MatchesResultTable } from './MatchResultTable.jsx';

function PairList({ pairs, title }) {
  if (!pairs.length) return null;

  return (
    <div className="iquit-batch-block">
      {title && <h4 className="iquit-batch-title">{title}</h4>}
      <div className="torneo-table-wrap">
        <table className="torneo-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Coppia</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair, i) => (
              <tr key={pair.id}>
                <td>{i + 1}</td>
                <td>
                  <span className={`torneo-team-pill ${pair.team}`}>
                    {pair.team === 'black' ? 'Black' : 'Yellow'}
                  </span>
                </td>
                <td>
                  {pair.label}
                  {!pair.mixed && (
                    <span className="iquit-mm-pill">Uomo-Uomo</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function IquitChampSection({
  iquit,
  busy,
  locked,
  lockedMessage,
  batch2Locked,
  batch2LockedMessage,
  onDrawPairs,
  onDrawMatches,
  onDrawPairsBatch2,
  onDrawMatchesBatch2,
  onReset,
}) {
  const {
    pairsDrawn,
    matchesDrawn,
    batch1Pairs,
    batch2Pairs,
    batch2PairsDrawn,
    batch2MatchesDrawn,
    matches,
    courtHolder,
  } = iquit;

  return (
    <section className="fase-section iquit-live-section">
      <div className="fase-section-head">
        <span className="fase-num iquit-live-num">iQ</span>
        <div>
          <h2>
            <span className="iquit-live-brand">iQuit</span> Champ
          </h2>
          <p className="fase-section-note">
            King of the court sul campo 4: chi vince resta, chi perde esce.
            Coppie miste per squadra (se serve, anche coppia uomo-uomo).
          </p>
        </div>
      </div>

      {locked && <p className="torneo-status fase-locked-msg">{lockedMessage}</p>}

      <div className="iquit-phase-block">
        <h3 className="iquit-phase-label">Turno 1 — Eliminati Fase 1</h3>
        <div className="fase-actions">
          <button
            type="button"
            className="fase-btn iquit-btn"
            disabled={busy || locked || pairsDrawn}
            onClick={onDrawPairs}
          >
            Estrai coppie iQuit
          </button>
          <button
            type="button"
            className="fase-btn iquit-btn"
            disabled={busy || locked || !pairsDrawn || matchesDrawn}
            onClick={onDrawMatches}
          >
            Estrai match iQuit
          </button>
        </div>
        {pairsDrawn && <PairList pairs={batch1Pairs} />}
      </div>

      <div className="iquit-phase-block">
        <h3 className="iquit-phase-label">Turno 2 — Eliminati Fase 2</h3>
        {batch2Locked && (
          <p className="torneo-status fase-locked-msg">{batch2LockedMessage}</p>
        )}
        <div className="fase-actions">
          <button
            type="button"
            className="fase-btn iquit-btn"
            disabled={busy || batch2Locked || !matchesDrawn || batch2PairsDrawn}
            onClick={onDrawPairsBatch2}
          >
            Estrai coppie (Fase 2)
          </button>
          <button
            type="button"
            className="fase-btn iquit-btn"
            disabled={
              busy || batch2Locked || !batch2PairsDrawn || batch2MatchesDrawn
            }
            onClick={onDrawMatchesBatch2}
          >
            Aggiungi match al campo
          </button>
        </div>
        {batch2PairsDrawn && <PairList pairs={batch2Pairs} title={null} />}
      </div>

      {matchesDrawn && (
        <>
          {courtHolder && (
            <p className="iquit-court-holder">
              Detentore campo: <strong>{courtHolder.label}</strong>
            </p>
          )}
          <MatchesResultTable
            title="Match — iQuit Champ"
            matches={matches}
            showMeta
          />
        </>
      )}

      {(pairsDrawn || matchesDrawn || batch2PairsDrawn) && (
        <button type="button" className="fase-reset-btn" disabled={busy} onClick={onReset}>
          Reset iQuit Champ
        </button>
      )}
    </section>
  );
}
