const SCORING = [
  {
    label: 'Fasi a gironi',
    sub: 'Fase 1 e Fase 2',
    points: '16',
    change: '8',
    detail: 'Set unico al meglio di 1. Un solo cambio campo, fissato a 8 punti.',
  },
  {
    label: 'Fasi finali',
    sub: 'Semifinali / ultima fase',
    points: '21',
    change: '11',
    detail: 'Set unico a 21 punti. Cambio campo fissato a 11.',
  },
  {
    label: 'Set finale',
    sub: 'Eventuale spareggio',
    points: '15',
    change: '—',
    detail: 'Se serve un terzo match ad estrazione, si gioca un set unico a 15 punti.',
  },
];

const PHASES = [
  {
    id: 'fase-1',
    num: '1',
    title: 'Fase 1 — Gironi e rotazione',
    blocks: [
      {
        title: 'Composizione',
        items: [
          '2 gironi, 6 coppie ciascuno.',
          'Per ogni girone: 3 coppie miste Team Black e 3 coppie miste Team Yellow, estratte a sorteggio.',
          'Ogni partita: coppia Black vs coppia Yellow, set unico a 16 (cambio campo a 8).',
        ],
      },
      {
        title: 'Campi e calendario',
        items: [
          '4 campi in gioco: Girone 1 su campo 1 e 3 · Girone 2 su campo 2 e 4.',
          'Si disputano le prime 4 partite in parallelo (2 per girone).',
          'Poi le ultime 2 partite rimanenti: una del Girone 1 e una del Girone 2.',
          'A questo punto si invertono le coppie Black tra i gironi: quelle del Girone 1 passano al Girone 2 e viceversa.',
        ],
      },
      {
        title: 'Eliminazioni',
        items: [
          'A fine Fase 1 si conteggiano i punti totali segnati da ogni giocatore nella fase.',
          'Per ogni team escono 2 uomini e 2 donne con meno punti fatti; a parità vince chi ha subito più punti.',
          'Gli 8 giocatori eliminati (4 per team) passano all’iQuit Champ sul campo 4.',
        ],
      },
    ],
  },
  {
    id: 'fase-2',
    num: '2',
    title: 'Fase 2 — Secondo girone',
    blocks: [
      {
        title: 'Composizione',
        items: [
          'I giocatori non eliminati in Fase 1 si ripartiscono in altri 2 gironi.',
          'Stessa logica della Fase 1, con inversione delle coppie Black tra i gironi dopo la prima tornata di partite.',
          'Match sempre a set unico, 16 punti, cambio campo a 8.',
        ],
      },
      {
        title: 'Eliminazioni',
        items: [
          'A conclusione della Fase 2 escono altri 4 giocatori per team (2 uomini e 2 donne). Punti fatti e subiti si sommano tra Fase 1 e Fase 2; a parità esce chi ha subito più punti.',
          'Si uniscono all’iQuit Champ in corso sul campo 4.',
        ],
      },
    ],
  },
  {
    id: 'finale',
    num: '3',
    title: 'Fase 3 — Gironi finali',
    blocks: [
      {
        title: 'Composizione',
        items: [
          '2 gironi da 4 coppie ciascuno: 2 Black + 2 Yellow per girone.',
          'Nuove coppie miste estratte per squadra tra i semifinalisti (8 giocatori per team).',
          'Ogni partita: coppia Black vs coppia Yellow, set unico a 21 (cambio campo a 11).',
        ],
      },
    ],
  },
];

const COURTS = [
  { id: 1, girone: 'Girone 1' },
  { id: 2, girone: 'Girone 2' },
  { id: 3, girone: 'Girone 1' },
  { id: 4, girone: 'Girone 2 · iQuit Champ' },
];

export default function FormulaSection() {
  return (
    <section id="formula">
      <div className="wrap">
        <div className="section-kicker">Programma della serata</div>
        <h2 className="section-title">Formula di gioco</h2>
        <p className="section-sub formula-intro">
          Torneo a squadre Black vs Yellow: tre fasi a gironi, rotazioni e finale.
          In parallelo, sul campo 4, corre l&apos;
          <a href="#iquit" className="formula-iquit-link">
            iQuit Champ
          </a>
          .
        </p>

        <div className="formula-overview">
          <div className="formula-stat">
            <span className="formula-stat-num">4</span>
            <span className="formula-stat-label">Campi</span>
          </div>
          <div className="formula-stat">
            <span className="formula-stat-num">2</span>
            <span className="formula-stat-label">Gironi per fase</span>
          </div>
          <div className="formula-stat">
            <span className="formula-stat-num">6</span>
            <span className="formula-stat-label">Coppie per girone</span>
          </div>
          <div className="formula-stat">
            <span className="formula-stat-num">3+3</span>
            <span className="formula-stat-label">Miste Black / Yellow</span>
          </div>
        </div>

        <div className="formula-courts">
          <h3 className="formula-courts-title">Mappa campi</h3>
          <div className="formula-courts-grid">
            {COURTS.map((c) => (
              <div key={c.id} className="formula-court">
                <span className="formula-court-num">Campo {c.id}</span>
                <span className="formula-court-girone">{c.girone}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="formula-scoring">
          <h3 className="formula-courts-title">Regole di punteggio</h3>
          <div className="formula-scoring-grid">
            {SCORING.map((rule) => (
              <div key={rule.label} className="formula-score-card">
                <span className="formula-score-label">{rule.label}</span>
                <span className="formula-score-sub">{rule.sub}</span>
                <div className="formula-score-nums">
                  <div>
                    <span className="formula-score-num">{rule.points}</span>
                    <span className="formula-score-unit">punti</span>
                  </div>
                  {rule.change !== '—' && (
                    <div>
                      <span className="formula-score-num">{rule.change}</span>
                      <span className="formula-score-unit">cambio campo</span>
                    </div>
                  )}
                </div>
                <p className="formula-score-detail">{rule.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="formula-phases">
          {PHASES.map((phase) => (
            <article key={phase.id} className="formula-phase" id={phase.id}>
              <div className="formula-phase-head">
                <span className="formula-phase-num">{phase.num}</span>
                <h3>{phase.title}</h3>
              </div>
              <div className="formula-phase-body">
                {phase.blocks.map((block) => (
                  <div key={block.title} className="formula-block">
                    <h4>{block.title}</h4>
                    <ul>
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <a href="#iquit" className="formula-iquit-cta">
          <p className="formula-iquit-cta-lead">
            E se perdi nella fase a gironi{' '}
            <span className="formula-iquit-cta-em">preparati a giocare</span>
          </p>
          <p className="formula-iquit-cta-brand">
            <span className="brand-iquit">iQuit</span>
            <span className="brand-champ">Champ</span>
          </p>
          <span className="formula-iquit-cta-arrow" aria-hidden>
            ↓
          </span>
        </a>
      </div>
    </section>
  );
}
