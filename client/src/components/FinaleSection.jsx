import { MatchesResultTable } from './MatchResultTable.jsx';

function PairsTable({ pairs }) {
  if (!pairs.length) return null;

  return (
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
              <td>{pair.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FinaleSection({
  finale,
  busy,
  locked,
  lockedMessage,
  onDrawPairs,
  onDrawSemifinals,
  onDrawTiebreak,
  onReset,
}) {
  const {
    pairsDrawn,
    semifinalsDrawn,
    tiebreakDrawn,
    pairs,
    semifinals,
    tiebreak,
    blackChampion,
    yellowChampion,
  } = finale;

  const semisComplete = semifinals.length === 2 && semifinals.every((m) => m.completed);
  const allFinaleMatches = [
    ...semifinals.map((m, i) => ({ ...m, matchLabel: m.matchLabel || `semi-${i + 1}` })),
    ...(tiebreak ? [tiebreak] : []),
  ];

  return (
    <section className="fase-section finale-section">
      <div className="fase-section-head">
        <span className="fase-num">3</span>
        <div>
          <h2>Fase finale</h2>
          <p className="fase-section-note">
            Le ultime 4 coppie (2 per squadra). Due semifinali a 21 punti in parallelo.
            Se serve, spareggio a 15 ad estrazione.
          </p>
          <ul className="fase-rules-list">
            <li>Rimescolamento: nuove coppie miste tra i semifinalisti.</li>
            <li>Nessuna coppia può ripetersi rispetto alla Fase 2.</li>
            <li>Due match Black vs Yellow sorteggiati contemporaneamente.</li>
          </ul>
        </div>
      </div>

      {locked && <p className="torneo-status fase-locked-msg">{lockedMessage}</p>}

      <div className="fase-actions">
        <button
          type="button"
          className="fase-btn"
          disabled={busy || locked || pairsDrawn}
          onClick={onDrawPairs}
        >
          Rimescola ed estrai coppie
        </button>
        <button
          type="button"
          className="fase-btn"
          disabled={busy || locked || !pairsDrawn || semifinalsDrawn}
          onClick={onDrawSemifinals}
        >
          Sorteggia semifinali
        </button>
        <button
          type="button"
          className="fase-btn finale-tb-btn"
          disabled={busy || locked || !semifinalsDrawn || !semisComplete || tiebreakDrawn}
          onClick={onDrawTiebreak}
        >
          Estrai spareggio
        </button>
      </div>

      {pairsDrawn && !semifinalsDrawn && (
        <div className="fase-block">
          <h3 className="fase-block-title">Coppie finali ({pairs.length})</h3>
          <PairsTable pairs={pairs} />
        </div>
      )}

      {semifinalsDrawn && (
        <MatchesResultTable title="Match — Finale" matches={allFinaleMatches} />
      )}

      {(blackChampion || yellowChampion) && (
        <div className="finale-champions">
          {blackChampion && (
            <p>
              <span className="torneo-team-pill black">Black</span>{' '}
              <strong>{blackChampion.label}</strong>
            </p>
          )}
          {yellowChampion && (
            <p>
              <span className="torneo-team-pill yellow">Yellow</span>{' '}
              <strong>{yellowChampion.label}</strong>
            </p>
          )}
        </div>
      )}

      {(pairsDrawn || semifinalsDrawn || tiebreakDrawn) && (
        <button type="button" className="fase-reset-btn" disabled={busy} onClick={onReset}>
          Reset finale
        </button>
      )}
    </section>
  );
}
