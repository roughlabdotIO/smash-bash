const RULES = [
  {
    icon: '⇄',
    title: 'Shuffle',
    text: 'Nuovo o stesso partner? Il sorteggio ti dirà con chi giocherai tutti i match.',
  },
  {
    icon: '👑',
    title: 'King of Court',
    lines: [
      'Chi vince resta',
      'chi perde',
      'saluta il torneo e va sotto la doccia',
    ],
  },
  {
    icon: '♀♂',
    title: 'Tag-Team Mixed',
    text: 'Come prima si gioca rete 2,35 m e coppie miste.',
  },
];

const FLOW = [
  {
    label: 'Starting point',
    text: '8 giocatori (4 per team) vengono eliminati dalla Fase 1. Si estraggono le coppie miste e inizia il torneo iQuit.',
  },
  {
    label: 'Fase di gioco',
    items: [
      'La coppia che vince il primo match resta in campo. La coppia che perde è fuori dal torneo.',
      'Entra la seconda coppia: gioca subito il secondo match contro chi ha vinto. Chi vince resta in campo, chi perde esce dal torneo.',
      'Stessa logica per le altre coppie: una alla volta contro chi detiene il campo. Vince chi resta, perde chi esce.',
    ],
  },
  {
    label: 'Dalla Fase 2',
    text: 'Si pescano altri 8 giocatori eliminati, si estraggono le coppie e da subito la coppia che detiene il campo gioca con la prima delle 4 nuove coppie.',
  },
  {
    label: 'Finale',
    text: 'Il torneo si conclude quando termina l’ultimo match: vince la coppia che si aggiudica l’ultima partita.',
  },
];

export default function IquitSection() {
  return (
    <section id="iquit" className="iquit-section">
      <div className="iquit-band" aria-hidden />
      <div className="wrap iquit-wrap">
        <div className="iquit-hero">
          <h2 className="iquit-title">
            <span className="iquit-title-main">iQuit</span>
            <span className="iquit-title-sub">Champ</span>
          </h2>
          <p className="iquit-lead">
            Sei uscito dai gironi? Entra subito nel secondo torneo della serata.
            <br />
            <span className="iquit-lead-rule">
              Unica regola. Devi solo vincere per arrivare alla fine!
            </span>
          </p>
        </div>

        <div className="iquit-score-pill">
          <span className="iquit-score-big">16</span>
          <span className="iquit-score-meta">
            punti · cambio campo a <strong>8</strong>
          </span>
        </div>

        <div className="iquit-rules">
          {RULES.map((r) => (
            <div key={r.title} className="iquit-rule-card">
              <span className="iquit-rule-icon" aria-hidden>
                {r.icon}
              </span>
              <h3>{r.title}</h3>
              {r.lines ? (
                <p className="iquit-rule-lines">
                  {r.lines.map((line, i) => (
                    <span key={line}>
                      {line}
                      {i < r.lines.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              ) : (
                <p>{r.text}</p>
              )}
            </div>
          ))}
        </div>

        <div className="iquit-flow">
          <h3 className="iquit-block-title">Come funziona</h3>
          <div className="iquit-flow-steps">
            {FLOW.map((step, i) => (
              <article key={step.label} className="iquit-flow-step">
                <div className="iquit-flow-head">
                  <span className="iquit-flow-num">{i + 1}</span>
                  <h4>{step.label}</h4>
                </div>
                {step.items ? (
                  <ul>
                    {step.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{step.text}</p>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
