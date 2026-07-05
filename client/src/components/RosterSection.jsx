function formatCount(counts, team) {
  const c = counts[team];
  const total = c.M + c.F;
  return `${total}/12 · ${c.M}M ${c.F}F`;
}

function TeamColumn({ team, label, headClass, players, counts }) {
  const sorted = players
    .filter((p) => p.team === team)
    .sort((a, b) => a.drawnAt - b.drawnAt);

  return (
    <div className={`roster-col ${headClass}`}>
      <div className="roster-head">
        <span>{label}</span>
        <span className="roster-count">{formatCount(counts, team)}</span>
      </div>
      <div className="roster-body">
        {sorted.length === 0 ? (
          <div className="roster-empty">
            Ancora nessun giocatore. Sarai tu il primo?
          </div>
        ) : (
          <ol>
            {sorted.map((p) => (
              <li key={p.id}>
                <span>
                  {p.nome} {p.cognome}
                </span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <span className={`tag ${p.sesso}`}>{p.sesso}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

export default function RosterSection({ roster, counts }) {
  return (
    <section id="roster">
      <div className="wrap">
        <h2 className="section-title">Roster</h2>
        <p className="section-sub">
          Le squadre si riempiono in tempo reale a ogni estrazione. Massimo 6
          maschi e 6 femmine per lato.
        </p>
        <div className="roster-grid">
          <TeamColumn
            team="black"
            label="Team Black"
            headClass="black"
            players={roster}
            counts={counts}
          />
          <TeamColumn
            team="yellow"
            label="Team Yellow"
            headClass="yellow"
            players={roster}
            counts={counts}
          />
        </div>
      </div>
    </section>
  );
}
