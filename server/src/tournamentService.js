import { db } from './db.js';

const PHASE = 'fase-1';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getPlayerById(id) {
  return db.prepare('SELECT * FROM players WHERE id = ?').get(id);
}

function formatPlayer(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    cognome: row.cognome,
    sesso: row.sesso,
    team: row.team,
  };
}

function formPairsForTeam(players) {
  const males = shuffle(players.filter((p) => p.sesso === 'M'));
  const females = shuffle(players.filter((p) => p.sesso === 'F'));
  const pairs = [];
  const mixedCount = Math.min(males.length, females.length);

  for (let i = 0; i < mixedCount; i += 1) {
    pairs.push({ player1: males[i], player2: females[i], mixed: true });
  }

  const extraM = males.slice(mixedCount);
  const extraF = females.slice(mixedCount);

  for (let i = 0; i < extraM.length; i += 2) {
    if (i + 1 < extraM.length) {
      pairs.push({ player1: extraM[i], player2: extraM[i + 1], mixed: false });
    }
  }
  for (let i = 0; i < extraF.length; i += 2) {
    if (i + 1 < extraF.length) {
      pairs.push({ player1: extraF[i], player2: extraF[i + 1], mixed: false });
    }
  }

  return pairs;
}

function rowToPair(row) {
  const p1 = formatPlayer(getPlayerById(row.player1_id));
  const p2 = formatPlayer(getPlayerById(row.player2_id));
  return {
    id: row.id,
    team: row.team,
    girone: row.girone,
    mixed: Boolean(row.mixed),
    player1: p1,
    player2: p2,
    label: `${p1.nome} ${p1.cognome} + ${p2.nome} ${p2.cognome}`,
  };
}

function rowToMatch(row) {
  const blackPair = db.prepare('SELECT * FROM tournament_pairs WHERE id = ?').get(row.black_pair_id);
  const yellowPair = db.prepare('SELECT * FROM tournament_pairs WHERE id = ?').get(row.yellow_pair_id);
  return {
    id: row.id,
    girone: row.girone,
    blackPair: rowToPair(blackPair),
    yellowPair: rowToPair(yellowPair),
  };
}

function getStateFlags() {
  const pairsCount = db
    .prepare(`SELECT COUNT(*) AS n FROM tournament_pairs WHERE phase = ?`)
    .get(PHASE).n;
  const gironiCount = db
    .prepare(
      `SELECT COUNT(*) AS n FROM tournament_pairs WHERE phase = ? AND girone IS NOT NULL`
    )
    .get(PHASE).n;
  const matchesCount = db
    .prepare(`SELECT COUNT(*) AS n FROM tournament_matches WHERE phase = ?`)
    .get(PHASE).n;

  return {
    pairsDrawn: pairsCount > 0,
    gironiDrawn: gironiCount > 0 && gironiCount === pairsCount,
    matchesDrawn: matchesCount > 0,
  };
}

export function getFase1State() {
  const flags = getStateFlags();
  const pairRows = db
    .prepare(
      `SELECT * FROM tournament_pairs WHERE phase = ? ORDER BY team, id`
    )
    .all(PHASE);
  const pairs = pairRows.map(rowToPair);

  const matchRows = db
    .prepare(
      `SELECT * FROM tournament_matches WHERE phase = ? ORDER BY girone, id`
    )
    .all(PHASE);
  const matches = matchRows.map(rowToMatch);

  const gironeA = {
    pairs: pairs.filter((p) => p.girone === 'A'),
    matches: matches.filter((m) => m.girone === 'A'),
  };
  const gironeB = {
    pairs: pairs.filter((p) => p.girone === 'B'),
    matches: matches.filter((m) => m.girone === 'B'),
  };

  return {
    phase: PHASE,
    ...flags,
    pairs,
    gironeA,
    gironeB,
  };
}

export function drawPairs() {
  const flags = getStateFlags();
  if (flags.pairsDrawn) {
    return { error: 'Le coppie sono già state estratte.', status: 409 };
  }

  const players = db
    .prepare(`SELECT * FROM players WHERE team IS NOT NULL ORDER BY id`)
    .all();

  const blackPlayers = players.filter((p) => p.team === 'black');
  const yellowPlayers = players.filter((p) => p.team === 'yellow');

  if (blackPlayers.length < 2 || yellowPlayers.length < 2) {
    return { error: 'Servono almeno 2 giocatori per squadra.', status: 400 };
  }

  const blackPairs = formPairsForTeam(blackPlayers);
  const yellowPairs = formPairsForTeam(yellowPlayers);
  const now = Date.now();

  const insert = db.prepare(
    `INSERT INTO tournament_pairs (phase, team, player1_id, player2_id, mixed, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    for (const pair of blackPairs) {
      insert.run(PHASE, 'black', pair.player1.id, pair.player2.id, pair.mixed ? 1 : 0, now);
    }
    for (const pair of yellowPairs) {
      insert.run(PHASE, 'yellow', pair.player1.id, pair.player2.id, pair.mixed ? 1 : 0, now);
    }
  });

  tx();
  return { state: getFase1State() };
}

export function drawGironi() {
  const flags = getStateFlags();
  if (!flags.pairsDrawn) {
    return { error: 'Estrai prima le coppie.', status: 400 };
  }
  if (flags.gironiDrawn) {
    return { error: 'I gironi sono già stati estratti.', status: 409 };
  }

  const blackPairs = db
    .prepare(`SELECT * FROM tournament_pairs WHERE phase = ? AND team = 'black'`)
    .all(PHASE);
  const yellowPairs = db
    .prepare(`SELECT * FROM tournament_pairs WHERE phase = ? AND team = 'yellow'`)
    .all(PHASE);

  if (blackPairs.length !== 6 || yellowPairs.length !== 6) {
    return {
      error: `Servono 6 coppie per squadra (Black: ${blackPairs.length}, Yellow: ${yellowPairs.length}).`,
      status: 400,
    };
  }

  const blackShuffled = shuffle(blackPairs);
  const yellowShuffled = shuffle(yellowPairs);
  const update = db.prepare(`UPDATE tournament_pairs SET girone = ? WHERE id = ?`);

  const tx = db.transaction(() => {
    blackShuffled.forEach((pair, i) => {
      update.run(i < 3 ? 'A' : 'B', pair.id);
    });
    yellowShuffled.forEach((pair, i) => {
      update.run(i < 3 ? 'A' : 'B', pair.id);
    });
  });

  tx();
  return { state: getFase1State() };
}

export function drawMatches() {
  const flags = getStateFlags();
  if (!flags.gironiDrawn) {
    return { error: 'Estrai prima i gironi.', status: 400 };
  }
  if (flags.matchesDrawn) {
    return { error: 'I match sono già stati sorteggiati.', status: 409 };
  }

  const now = Date.now();
  const insert = db.prepare(
    `INSERT INTO tournament_matches (phase, girone, black_pair_id, yellow_pair_id, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    for (const girone of ['A', 'B']) {
      const blackInGirone = shuffle(
        db
          .prepare(
            `SELECT * FROM tournament_pairs WHERE phase = ? AND girone = ? AND team = 'black'`
          )
          .all(PHASE, girone)
      );
      const yellowInGirone = shuffle(
        db
          .prepare(
            `SELECT * FROM tournament_pairs WHERE phase = ? AND girone = ? AND team = 'yellow'`
          )
          .all(PHASE, girone)
      );

      if (blackInGirone.length !== 3 || yellowInGirone.length !== 3) {
        throw new Error('GIRONI_INVALID');
      }

      for (let i = 0; i < 3; i += 1) {
        insert.run(PHASE, girone, blackInGirone[i].id, yellowInGirone[i].id, now);
      }
    }
  });

  try {
    tx();
  } catch (err) {
    if (err.message === 'GIRONI_INVALID') {
      return { error: 'Ogni girone deve avere 3 coppie Black e 3 Yellow.', status: 400 };
    }
    throw err;
  }

  return { state: getFase1State() };
}

export function resetFase1() {
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM tournament_matches WHERE phase = ?`).run(PHASE);
    db.prepare(`DELETE FROM tournament_pairs WHERE phase = ?`).run(PHASE);
  });
  tx();
  return { state: getFase1State() };
}
