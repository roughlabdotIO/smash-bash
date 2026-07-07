import StandingsPanel from './StandingsPanel.jsx';

export default function PhaseRecapSection({ standings, title, note, elimNote }) {
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

      <StandingsPanel
        standings={standings}
        elimNote={elimNote}
        className="standings-panel--embedded"
      />
    </section>
  );
}
