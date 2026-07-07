export function MatchResultCell({ match }) {
  if (match?.ready === false) {
    return <span className="torneo-score-pending">In attesa</span>;
  }

  if (match?.completed) {
    return (
      <span className="torneo-score">
        <span className="torneo-score-black">{match.blackScore}</span>
        <span className="torneo-score-sep">–</span>
        <span className="torneo-score-yellow">{match.yellowScore}</span>
      </span>
    );
  }

  return <span className="torneo-score-pending">—</span>;
}

export function MatchesResultTable({ matches, title, showMeta = false }) {
  if (!matches?.length) return null;

  return (
    <div className="torneo-table-wrap">
      {title && <h4 className="torneo-girone-matches-title">{title}</h4>}
      <table className="torneo-table">
        <thead>
          <tr>
            <th>#</th>
            {showMeta && <th>Match</th>}
            <th>Team Black</th>
            <th />
            <th>Team Yellow</th>
            <th>Risultato</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match, i) => (
            <tr
              key={match.id}
              className={!match.ready ? 'torneo-match-row-pending' : undefined}
            >
              <td>{showMeta ? match.sequence ?? i + 1 : i + 1}</td>
              {showMeta && (
                <td className="torneo-match-meta-cell">
                  {match.batch === 2 && (
                    <span className="iquit-batch-pill">Fase 2</span>
                  )}
                  {match.isKingOfCourt && (
                    <span className="iquit-king-pill">Chi vince resta</span>
                  )}
                  {match.matchLabel === 'tiebreak' && (
                    <span className="finale-tb-pill">Spareggio</span>
                  )}
                </td>
              )}
              <td>
                {match.ready ? match.blackPair?.label : '—'}
              </td>
              <td className="torneo-vs">vs</td>
              <td>
                {match.ready ? match.yellowPair?.label : '—'}
              </td>
              <td className="torneo-score-cell">
                <MatchResultCell match={match} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
