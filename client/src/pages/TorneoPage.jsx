import { Link } from 'react-router-dom';

export default function TorneoPage() {
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
          <div className="torneo-wip">
            <span className="torneo-wip-label">WIP</span>
            <p>Pagina torneo in costruzione.</p>
            <p className="torneo-wip-sub">
              Qui troverai partite live, classifiche e avanzamento delle fasi.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
