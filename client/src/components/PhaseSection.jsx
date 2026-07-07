import { MatchesResultTable } from './MatchResultTable.jsx';

function PairRow({ pair, index, showRotation = false }) {
  const teamLabel = pair.team === 'black' ? 'Black' : 'Yellow';
  const pairName =
    pair.label ??
    `${pair.player1.nome} ${pair.player1.cognome} - ${pair.player2.nome} ${pair.player2.cognome}`;

  return (
    <tr>
      <td>{index}</td>
      <td>
        <span className={`torneo-team-pill ${pair.team}`}>{teamLabel}</span>
      </td>
      <td className="torneo-pair-name">{pairName}</td>
      {pair.girone && <td>Girone {pair.girone}</td>}
      {showRotation && (
        <td>
          {pair.team === 'black' && pair.fase1Girone && pair.girone ? (
            <span className="torneo-rotate-pill">
              ex {pair.fase1Girone} → {pair.girone}
            </span>
          ) : pair.team === 'yellow' && pair.girone ? (
            <span className="torneo-mix-pill">Mescolata</span>
          ) : null}
        </td>
      )}
    </tr>
  );
}

function PairsTable({ pairs, showGirone = false, showRotation = false }) {
  if (pairs.length === 0) return null;

  return (
    <div className="torneo-table-wrap">
      <table className="torneo-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>Coppia</th>
            {showGirone && <th>Girone</th>}
            {showRotation && <th>Assegnazione</th>}
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair, i) => (
            <PairRow
              key={pair.id}
              pair={pair}
              index={i + 1}
              showRotation={showRotation}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchesTable({ matches, gironeLabel }) {
  return (
    <MatchesResultTable
      matches={matches}
      title={`Match — Girone ${gironeLabel}`}
    />
  );
}
function GironeBlock({ label, girone, showRotation = false }) {
  if (girone.pairs.length === 0 && girone.matches.length === 0) return null;

  return (
    <div className="torneo-girone-block">
      <h3 className="torneo-girone-title">Girone {label}</h3>
      <PairsTable pairs={girone.pairs} showGirone={false} showRotation={showRotation} />
      <MatchesTable matches={girone.matches} gironeLabel={label} />
    </div>
  );
}

export default function PhaseSection({
  phaseNum,
  title,
  note,
  rules,
  state,
  busy,
  locked,
  lockedMessage,
  onDrawPairs,
  onDrawGironi,
  onDrawMatches,
  onReset,
  resetLabel,
  drawPairsLabel = 'Estrai coppie',
  drawGironiLabel = 'Estrai gironi',
  pairsBlockTitle,
  showRotation = false,
}) {
  const { pairsDrawn, gironiDrawn, matchesDrawn, pairs, gironeA, gironeB } = state;
  const pairsTitle = pairsBlockTitle
    ? `${pairsBlockTitle} (${pairs.length})`
    : `Tutte le coppie (${pairs.length})`;

  return (
    <section className="fase-section">
      <div className="fase-section-head">
        <span className="fase-num">{phaseNum}</span>
        <div>
          <h2>{title}</h2>
          {note && <p className="fase-section-note">{note}</p>}
          {rules?.length > 0 && (
            <ul className="fase-rules-list">
              {rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {locked && (
        <p className="torneo-status fase-locked-msg">{lockedMessage}</p>
      )}

      <div className="fase-actions">
        <button
          type="button"
          className="fase-btn"
          disabled={busy || locked || pairsDrawn}
          onClick={onDrawPairs}
        >
          {drawPairsLabel}
        </button>
        <button
          type="button"
          className="fase-btn"
          disabled={busy || locked || !pairsDrawn || gironiDrawn}
          onClick={onDrawGironi}
        >
          {drawGironiLabel}
        </button>
        <button
          type="button"
          className="fase-btn"
          disabled={busy || locked || !gironiDrawn || matchesDrawn}
          onClick={onDrawMatches}
        >
          Sorteggia i match
        </button>
      </div>

      {pairsDrawn && !gironiDrawn && (
        <div className="fase-block">
          <h3 className="fase-block-title">{pairsTitle}</h3>
          <PairsTable pairs={pairs} />
        </div>
      )}

      {gironiDrawn && (
        <div className="fase-gironi-grid">
          <GironeBlock label="A" girone={gironeA} showRotation={showRotation} />
          <GironeBlock label="B" girone={gironeB} showRotation={showRotation} />
        </div>
      )}

      {(pairsDrawn || gironiDrawn || matchesDrawn) && (
        <button
          type="button"
          className="fase-reset-btn"
          disabled={busy}
          onClick={onReset}
        >
          {resetLabel}
        </button>
      )}
    </section>
  );
}
