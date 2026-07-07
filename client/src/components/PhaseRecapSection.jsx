function StandingsTable({ team, label }) {
  if (!team?.rows?.length) return null;

  return (
    <div className="recap-team-block">
      <h3 className="recap-team-title">
        <span className={`torneo-team-pill ${label === 'Black' ? 'black' : 'yellow'}`}>{label}</span>
      </h3>
      <div className="torneo-table-wrap">
        <table className="torneo-table recap-table">
          <thead>
            <tr>
              <th>Giocatore</th>
              <th>Girone</th>
              <th>Punti</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {team.rows.map((row) => (
              <tr key={row.id} className={row.eliminated ? 'recap-eliminated' : ''}>
                <td>
                  {row.nome} {row.cognome}
                </td>
                <td>Girone {row.girone}</td>
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
      <p className="recap-elim-note">
        Eliminati: {team.eliminated.length} giocatori (2 uomini + 2 donne per girone)
      </p>
    </div>
  );
}

export default function PhaseRecapSection({
  standings,
  title,
  note,
  elimNote,
}) {
  if (!standings?.ready) return null;

  return (
    <section className="fase-section recap-section">
      <div className="fase-section-head">
        <span className="fase-num">★</span>
        <div>
          <h2>{title}</h2>
          <p className="fase-section-note">{note}</p>
        </div>
      </div>

      <div className="recap-teams-grid">
        <StandingsTable team={standings.black} label="Black" />
        <StandingsTable team={standings.yellow} label="Yellow" />
      </div>

      {elimNote && <p className="recap-footer-note">{elimNote}</p>}
    </section>
  );
}
