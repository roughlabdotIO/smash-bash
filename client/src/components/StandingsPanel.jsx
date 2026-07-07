function StandingsTable({ team, label, compact, showElimNote }) {
  if (!team?.rows?.length) return null;

  return (
    <div className="recap-team-block">
      <h3 className="recap-team-title">
        <span className={`torneo-team-pill ${label === 'Black' ? 'black' : 'yellow'}`}>{label}</span>
      </h3>
      <div className="torneo-table-wrap">
        <table className={`torneo-table recap-table${compact ? ' recap-table--compact' : ''}`}>
          <thead>
            <tr>
              <th>Giocatore</th>
              {!compact && <th>Girone</th>}
              <th>Punti fatti</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {team.rows.map((row) => (
              <tr key={row.id} className={row.eliminated ? 'recap-eliminated' : ''}>
                <td>
                  {row.nome} {row.cognome}
                  {compact && (
                    <span className="standings-girone-tag">G{row.girone}</span>
                  )}
                </td>
                {!compact && <td>Girone {row.girone}</td>}
                <td className="recap-points">{row.points}</td>
                <td>
                  {row.eliminated ? (
                    <span className="recap-elim-badge">Eliminato</span>
                  ) : (
                    <span className="recap-active-badge">In gara</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showElimNote && (
        <p className="recap-elim-note">
          Eliminati: {team.eliminated.length} giocatori (2 uomini + 2 donne per girone)
        </p>
      )}
    </div>
  );
}

export default function StandingsPanel({
  standings,
  title,
  note,
  elimNote,
  onlyWhenReady = false,
  compact = false,
  className = '',
}) {
  if (onlyWhenReady && !standings?.ready) return null;
  if (!standings?.available) {
    if (onlyWhenReady) return null;
    return (
      <section className={`standings-panel standings-panel--empty ${className}`}>
        {title && <h2 className="standings-panel-title">{title}</h2>}
        <p className="standings-empty-msg">Classifica disponibile dopo l&apos;estrazione dei gironi.</p>
      </section>
    );
  }

  const progress =
    standings.matchesTotal > 0
      ? `${standings.matchesPlayed} / ${standings.matchesTotal} match`
      : null;

  return (
    <section className={`standings-panel ${compact ? 'standings-panel--compact' : ''} ${className}`}>
      {title && (
        <div className="standings-panel-head">
          <h2 className="standings-panel-title">{title}</h2>
          {progress && !standings.ready && (
            <span className="standings-live-badge">Live · {progress}</span>
          )}
          {standings.ready && <span className="standings-complete-badge">Fase conclusa</span>}
        </div>
      )}
      {note && <p className="standings-panel-note">{note}</p>}

      <div className="recap-teams-grid">
        <StandingsTable team={standings.black} label="Black" compact={compact} showElimNote={standings.ready} />
        <StandingsTable team={standings.yellow} label="Yellow" compact={compact} showElimNote={standings.ready} />
      </div>

      {elimNote && standings.ready && <p className="recap-footer-note">{elimNote}</p>}
    </section>
  );
}
