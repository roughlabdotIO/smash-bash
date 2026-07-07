import { Link } from 'react-router-dom';
import { useRoster } from '../hooks/useRoster.js';
import FormulaSection from '../components/FormulaSection.jsx';
import IquitSection from '../components/IquitSection.jsx';
import RosterSection from '../components/RosterSection.jsx';

export default function LandingPage() {
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
          <a href="#torneo" className="hero-cta">
            Scopri il torneo
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

      <div id="torneo">
        <section id="formato">
          <div className="wrap">
            <div className="section-kicker">Il formato</div>
            <h2 className="section-title">Game Format</h2>
            <p className="section-sub">
              Due squadre, Team Black contro Team Yellow: gironi a coppie miste,
              rotazioni e fasi eliminatorie fino alla finale.
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
                <div className="rule-num">24</div>
                <h3>Roster completo</h3>
                <p>
                  Le iscrizioni sono chiuse. I giocatori sono stati assegnati a
                  Team Black o Team Yellow — scopri le formazioni qui sotto.
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
      </div>

      {/*
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
          <div className="registration-fee">
            <div className="registration-fee-title">Costo iscrizione torneo</div>
            <p className="registration-fee-body">
              <strong>15€</strong> oppure, se hai un abbonamento, puoi scalare le
              tue ore d&apos;allenamento.
            </p>
          </div>
          <RegistrationPanel />
        </div>
      </section>
      */}

      <RosterSection roster={roster} counts={counts} />

      <section className="torneo-cta-section">
        <div className="wrap torneo-cta-wrap">
          <Link to="/torneo" className="torneo-cta-btn">
            Vai al Torneo
          </Link>
        </div>
      </section>

      <footer>
        <strong>Smash Bash</strong> — Beach volley Tournament hosted by Outsiders.bv
      </footer>
    </>
  );
}
