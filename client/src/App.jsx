import { useRoster } from './hooks/useRoster.js';
import FormulaSection from './components/FormulaSection.jsx';
import IquitSection from './components/IquitSection.jsx';
import RegistrationPanel from './components/RegistrationPanel.jsx';
import RosterSection from './components/RosterSection.jsx';

export default function App() {
  const { roster, counts } = useRoster();

  return (
    <>
      <header className="hero">
        <div className="hero-split">
          <div className="side black" />
          <div className="side yellow" />
        </div>
        <div className="hero-inner">
          <h1 className="hero-logo">
            <img
              src="/smash-bash-logo.png"
              alt="Smash Bash"
              className="hero-logo-img hero-logo-img--desktop"
              width={612}
              height={408}
            />
            <img
              src="/smash-bash-logo-mobile.png"
              alt="Smash Bash"
              className="hero-logo-img hero-logo-img--mobile"
              width={500}
              height={500}
            />
          </h1>
          <p
            className="hero-tagline"
            aria-label="Not another FxxxING beach volley tournament"
          >
            <span className="hero-tagline-line hero-tagline-line--1">
              Not another
            </span>
            <span className="hero-tagline-line hero-tagline-line--2">
              FxxxING beach volley
            </span>
            <span className="hero-tagline-line hero-tagline-line--3">tournament</span>
          </p>
          <a href="#iscrizione" className="hero-cta">
            Iscriviti
          </a>
        </div>
      </header>

      <div className="ticket">
        <div className="ticket-cell">
          <div className="ticket-label">Dove</div>
          <div className="ticket-value">Beach Arena</div>
          <div className="ticket-sub">Via I° Maggio — Ancona</div>
        </div>
        <div className="ticket-cell">
          <div className="ticket-label">Quando</div>
          <div className="ticket-value">7 Luglio</div>
          <div className="ticket-sub">Martedì</div>
        </div>
        <div className="ticket-cell">
          <div className="ticket-label">Ritrovo</div>
          <div className="ticket-value">Ore 18:30</div>
          <div className="ticket-sub">Riscaldamento e briefing</div>
        </div>
        <div className="ticket-cell">
          <div className="ticket-label">Inizio gare</div>
          <div className="ticket-value">Ore 19:00</div>
          <div className="ticket-sub">Cominciamo i primi matches</div>
        </div>
      </div>

      <section id="formato">
        <div className="wrap">
          <div className="section-kicker">Il formato</div>
          <h2 className="section-title">Game Format</h2>
          <p className="section-sub">
            Due squadre soltanto, inserisci i dati nel form che trovi in fondo
            alla pagina, iscriviti e sorteggia la squadra con la quale giocherai.
          </p>
          <div className="format-grid">
            <div className="rule-card">
              <div className="rule-num">2</div>
              <h3>Due squadre</h3>
              <p>
                Team Black contro Team Yellow su quattro campi: gironi a coppie
                miste, rotazioni e fasi eliminatorie fino alla finale.
              </p>
            </div>
            <div className="rule-card">
              <div className="rule-num">12</div>
              <h3>Max 12 per squadra</h3>
              <p>
                Ogni squadra è composta da un massimo di 12 membri: 6 maschi e
                6 femmine. Squadre bilanciate, gioco vero.
              </p>
            </div>
            <div className="rule-card">
              <div className="rule-num">?</div>
              <h3>Sorteggio cieco</h3>
              <p>
                Non scegli la tua squadra: dopo l&apos;iscrizione premi
                &quot;Estrai squadra&quot; e scopri all&apos;istante il tuo
                colore.
              </p>
            </div>
            <div className="rule-card rule-card--iquit">
              <div className="rule-num">iQ</div>
              <h3>iQuit Champ</h3>
              <p>
                Eliminato dai gironi? Sul campo 4 ti aspetta un king of the court
                parallelo — <a href="#iquit">secondo trofeo della serata</a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FormulaSection />

      <IquitSection />

      <section id="iscrizione">
        <div className="wrap">
          <div className="section-kicker">Posti limitati · 24 totali</div>
          <h2 className="section-title" style={{ color: 'var(--sand)' }}>
            Iscriviti al torneo
          </h2>
          <p className="section-sub">
            Inserisci i tuoi dati, poi estrai la squadra. Il tuo nome comparirà
            nel roster pubblico qui sotto, visibile a tutti gli iscritti.
          </p>
          <RegistrationPanel />
        </div>
      </section>

      <RosterSection roster={roster} counts={counts} />

      <footer>
        <strong>Smash Bash</strong> — Beach volley Tournament hosted by Outsiders.bv
      </footer>
    </>
  );
}
