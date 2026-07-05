import { useState, useRef, useCallback, useEffect } from 'react';
import { registerPlayer, drawPlayer } from '../api.js';

export default function RegistrationPanel() {
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [sesso, setSesso] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [locked, setLocked] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [drawPhase, setDrawPhase] = useState('idle');
  const [flashClass, setFlashClass] = useState('');
  const [result, setResult] = useState(null);
  const flickerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (flickerRef.current) clearInterval(flickerRef.current);
    };
  }, []);

  const showMsg = (text, type = '') => setMsg({ text, type });

  const resetForm = useCallback(() => {
    setNome('');
    setCognome('');
    setSesso(null);
    setPendingId(null);
    setLocked(false);
    setDrawPhase('idle');
    setFlashClass('');
    setResult(null);
    showMsg('');
  }, []);

  async function handleRegister(e) {
    e.preventDefault();
    if (locked) return;

    try {
      const data = await registerPlayer({ nome, cognome, sesso });
      setPendingId(data.player.id);
      setLocked(true);
      showMsg(
        `Iscrizione registrata, ${data.player.nome}! Ora estrai la tua squadra →`,
        'ok'
      );
    } catch (err) {
      showMsg(err.message, 'err');
    }
  }

  async function handleDraw() {
    if (!pendingId || drawPhase !== 'idle') return;

    setDrawPhase('animating');
    let i = 0;
    flickerRef.current = setInterval(() => {
      setFlashClass(i % 2 === 0 ? 'flash-black' : 'flash-yellow');
      i++;
    }, 160);

    await new Promise((r) => setTimeout(r, 2200));

    clearInterval(flickerRef.current);
    flickerRef.current = null;

    try {
      const { player } = await drawPlayer(pendingId);
      const teamClass = player.team === 'black' ? 'flash-black' : 'flash-yellow';
      setFlashClass(teamClass);
      setResult(player);
      setDrawPhase('done');
      showMsg('');
      setTimeout(resetForm, 4000);
    } catch (err) {
      setFlashClass('');
      setDrawPhase('idle');
      showMsg(err.message, 'err');
      setLocked(false);
      setPendingId(null);
    }
  }

  const canDraw = locked && pendingId && drawPhase === 'idle';

  return (
    <div className="reg-panel">
      <form className="reg-form" onSubmit={handleRegister}>
        <div className="field">
          <label htmlFor="nome">Nome</label>
          <input
            id="nome"
            type="text"
            maxLength={40}
            autoComplete="given-name"
            placeholder="Es. Giulia"
            value={nome}
            disabled={locked}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="cognome">Cognome</label>
          <input
            id="cognome"
            type="text"
            maxLength={40}
            autoComplete="family-name"
            placeholder="Es. Rossi"
            value={cognome}
            disabled={locked}
            onChange={(e) => setCognome(e.target.value)}
          />
        </div>
        <div className="field">
          <span className="field-label" id="sesso-label">
            Sesso
          </span>
          <div className="gender-row" role="group" aria-labelledby="sesso-label">
            {['M', 'F'].map((g) => (
              <button
                key={g}
                type="button"
                className={`gender-btn${sesso === g ? ' sel' : ''}`}
                disabled={locked}
                aria-pressed={sesso === g}
                onClick={() => setSesso(g)}
              >
                {g === 'M' ? 'Maschio' : 'Femmina'}
              </button>
            ))}
          </div>
        </div>
        <button className="big-btn" type="submit" disabled={locked}>
          Iscriviti
        </button>
        <div className={`form-msg ${msg.type}`} aria-live="polite">
          {msg.text}
        </div>
      </form>

      <div className={`draw-box ${flashClass}`}>
        {drawPhase !== 'done' ? (
          <>
            <div className="draw-title">Il sorteggio</div>
            <p className="draw-sub">
              Prima completa l&apos;iscrizione. Poi premi il pulsante e lascia
              decidere alla sorte: nero o giallo?
            </p>
            <button
              type="button"
              className="draw-btn"
              disabled={!canDraw}
              onClick={handleDraw}
            >
              Estrai squadra
            </button>
          </>
        ) : (
          <>
            <div className="draw-title" style={{ fontSize: '1rem', letterSpacing: '0.2em' }}>
              Sei nel
            </div>
            <div
              className="result-team"
              style={{
                color: result.team === 'black' ? 'var(--sand)' : 'var(--ink)',
              }}
            >
              {result.team === 'black' ? 'Team Black' : 'Team Yellow'}
            </div>
            <div className="result-name">
              {result.nome} {result.cognome} — ci vediamo in campo!
            </div>
          </>
        )}
      </div>
    </div>
  );
}
