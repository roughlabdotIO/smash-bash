import { db, CAP } from './db.js';

function rowToPlayer(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    cognome: row.cognome,
    sesso: row.sesso,
    telefono: row.telefono ?? '',
    team: row.team,
    drawnAt: row.drawn_at,
    createdAt: row.created_at,
  };
}

function normalizeTelefono(value) {
  return value?.trim().replace(/[\s-]/g, '') ?? '';
}

function isValidTelefono(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15;
}

export function getCounts() {
  const rows = db
    .prepare(
      `SELECT team, sesso, COUNT(*) AS n
       FROM players
       WHERE team IS NOT NULL
       GROUP BY team, sesso`
    )
    .all();

  const counts = {
    black: { M: 0, F: 0 },
    yellow: { M: 0, F: 0 },
  };
  for (const row of rows) {
    counts[row.team][row.sesso] = row.n;
  }
  return counts;
}

export function getRoster() {
  const rows = db
    .prepare(
      `SELECT * FROM players
       WHERE team IS NOT NULL
       ORDER BY drawn_at ASC`
    )
    .all();
  return rows.map((row) => {
    const { telefono, ...player } = rowToPlayer(row);
    return player;
  });
}

export function registerPlayer({ nome, cognome, sesso, telefono }) {
  const trimmedNome = nome?.trim();
  const trimmedCognome = cognome?.trim();
  const normalizedTelefono = normalizeTelefono(telefono);

  if (!trimmedNome || !trimmedCognome) {
    return { error: 'Inserisci nome e cognome.', status: 400 };
  }
  if (!['M', 'F'].includes(sesso)) {
    return { error: 'Seleziona il sesso.', status: 400 };
  }
  if (!isValidTelefono(normalizedTelefono)) {
    return { error: 'Inserisci un numero di telefono valido.', status: 400 };
  }

  const existing = db
    .prepare(
      `SELECT id, team FROM players
       WHERE nome = ? COLLATE NOCASE AND cognome = ? COLLATE NOCASE`
    )
    .get(trimmedNome, trimmedCognome);

  if (existing) {
    if (existing.team) {
      return { error: 'Questo giocatore risulta già iscritto.', status: 409 };
    }
    const player = rowToPlayer(
      db.prepare('SELECT * FROM players WHERE id = ?').get(existing.id)
    );
    return { player, pending: true };
  }

  const counts = getCounts();
  const free =
    CAP - counts.black[sesso] + (CAP - counts.yellow[sesso]);
  if (free <= 0) {
    return {
      error: `Posti esauriti per la categoria ${sesso === 'M' ? 'maschile' : 'femminile'}.`,
      status: 409,
    };
  }

  try {
    const info = db
      .prepare(
        `INSERT INTO players (nome, cognome, sesso, taglia, telefono)
         VALUES (?, ?, ?, '', ?)`
      )
      .run(trimmedNome, trimmedCognome, sesso, normalizedTelefono);
    const player = rowToPlayer(
      db.prepare('SELECT * FROM players WHERE id = ?').get(info.lastInsertRowid)
    );
    return { player };
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { error: 'Questo giocatore risulta già iscritto.', status: 409 };
    }
    throw err;
  }
}

function pickTeam(sesso) {
  const counts = getCounts();
  const eligible = [];
  if (counts.black[sesso] < CAP) eligible.push('black');
  if (counts.yellow[sesso] < CAP) eligible.push('yellow');
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

export function drawTeam(playerId) {
  const drawTx = db.transaction((id) => {
    const row = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
    if (!row) return { error: 'Giocatore non trovato.', status: 404 };
    if (row.team) return { error: 'Sorteggio già effettuato.', status: 409 };

    const team = pickTeam(row.sesso);
    if (!team) {
      return {
        error: 'Nel frattempo i posti si sono esauriti per la tua categoria.',
        status: 409,
      };
    }

    const now = Date.now();
    db.prepare(
      `UPDATE players SET team = ?, drawn_at = ? WHERE id = ? AND team IS NULL`
    ).run(team, now, id);

    const updated = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
    if (!updated?.team) {
      return {
        error: 'Nel frattempo i posti si sono esauriti per la tua categoria.',
        status: 409,
      };
    }

    return { player: rowToPlayer(updated) };
  });

  return drawTx(playerId);
}

export function getRosterPayload() {
  return {
    roster: getRoster(),
    counts: getCounts(),
  };
}
