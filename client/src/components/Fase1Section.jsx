function PlayerTag({ sesso }) {
  return <span className={`tag ${sesso}`}>{sesso}</span>;
}

function PairRow({ pair, index }) {
  const teamLabel = pair.team === 'black' ? 'Black' : 'Yellow';
  return (
    <tr>
      <td>{index}</td>
      <td>
        <span className={`torneo-team-pill ${pair.team}`}>{teamLabel}</span>
      </td>
      <td>
        {pair.player1.nome} {pair.player1.cognome}{' '}
        <PlayerTag sesso={pair.player1.sesso} />
      </td>
      <td className="torneo-pair-plus">+</td>
      <td>
        {pair.player2.nome} {pair.player2.cognome}{' '}
        <PlayerTag sesso={pair.player2.sesso} />
      </td>
      <td>
        {pair.mixed ? (
          <span className="torneo-mixed-pill">Mista</span>
        ) : (
          <span className="torneo-same-pill">Stesso sesso</span>
        )}
      </td>
      {pair.girone && <td>Girone {pair.girone}</td>}
    </tr>
  );
}

function PairsTable({ pairs, showGirone = false }) {
  if (pairs.length === 0) return null;

  return (
    <div className="torneo-table-wrap">
      <table className="torneo-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>Giocatore 1</th>
            <th />
            <th>Giocatore 2</th>
            <th>Tipo</th>
            {showGirone && <th>Girone</th>}
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair, i) => (
            <PairRow key={pair.id} pair={pair} index={i + 1} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchesTable({ matches, gironeLabel }) {
  if (matches.length === 0) return null;

  return (
    <div className="torneo-table-wrap">
      <h4 className="torneo-girone-matches-title">Match — Girone {gironeLabel}</h4>
      <table className="torneo-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team Black</th>
            <th />
            <th>Team Yellow</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match, i) => (
            <tr key={match.id}>
              <td>{i + 1}</td>
              <td>{match.blackPair.label}</td>
              <td className="torneo-vs">vs</td>
              <td>{match.yellowPair.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GironeBlock({ label, girone }) {
  if (girone.pairs.length === 0 && girone.matches.length === 0) return null;

  return (
    <div className="torneo-girone-block">
      <h3 className="torneo-girone-title">Girone {label}</h3>
      <PairsTable pairs={girone.pairs} showGirone={false} />
      <MatchesTable matches={girone.matches} gironeLabel={label} />
    </div>
  );
}

export default function Fase1Section({ state, onDrawPairs, onDrawGironi, onDrawMatches, onReset, busy }) {
  const { pairsDrawn, gironiDrawn, matchesDrawn, pairs, gironeA, gironeB } = state;

  return (
    <section className="fase-section">
      <div className="fase-section-head">
        <span className="fase-num">1</span>
        <h2>Fase 1 — Gironi e rotazione</h2>
      </div>

      <div className="fase-actions">
        <button
          type="button"
          className="fase-btn"
          disabled={busy || pairsDrawn}
          onClick={onDrawPairs}
        >
          Estrai coppie
        </button>
        <button
          type="button"
          className="fase-btn"
          disabled={busy || !pairsDrawn || gironiDrawn}
          onClick={onDrawGironi}
        >
          Estrai gironi
        </button>
        <button
          type="button"
          className="fase-btn"
          disabled={busy || !gironiDrawn || matchesDrawn}
          onClick={onDrawMatches}
        >
          Sorteggia i match
        </button>
      </div>

      {pairsDrawn && !gironiDrawn && (
        <div className="fase-block">
          <h3 className="fase-block-title">Tutte le coppie (12)</h3>
          <PairsTable pairs={pairs} />
        </div>
      )}

      {gironiDrawn && (
        <div className="fase-gironi-grid">
          <GironeBlock label="A" girone={gironeA} />
          <GironeBlock label="B" girone={gironeB} />
        </div>
      )}

      {(pairsDrawn || gironiDrawn || matchesDrawn) && (
        <button
          type="button"
          className="fase-reset-btn"
          disabled={busy}
          onClick={onReset}
        >
          Reset Fase 1
        </button>
      )}
    </section>
  );
}
