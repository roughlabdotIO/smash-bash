import { db } from './db.js';
import { formatPlayer, getPlayerById } from './standingsService.js';

const BATCH_1 = 1;
const BATCH_2 = 2;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

function rowToIquitPair(row) {
  const p1 = formatPlayer(getPlayerById(row.player1_id));
  const p2 = formatPlayer(getPlayerById(row.player2_id));
  return {
    id: row.id,
    batch: row.batch,
    team: row.team,
    mixed: Boolean(row.mixed),
    player1: p1,
    player2: p2,
    label: `${p1.nome} ${p1.cognome} - ${p2.nome} ${p2.cognome}`,
  };
}

function getWinnerPair(match) {
  if (!match.completed) return null;
  if (match.blackScore > match.yellowScore) return match.blackPair;
  if (match.yellowScore > match.blackScore) return match.yellowPair;
  return null;
}

function resolveMatchSides(row, matchById) {
  if (!row.holder_from_match_id) {
    return {
      blackPair: rowToIquitPair(db.prepare('SELECT * FROM iquit_pairs WHERE id = ?').get(row.black_pair_id)),
      yellowPair: rowToIquitPair(db.prepare('SELECT * FROM iquit_pairs WHERE id = ?').get(row.yellow_pair_id)),
    };
  }

  const prev = matchById.get(row.holder_from_match_id);
  if (!prev) return { blackPair: null, yellowPair: null };

  const holder = getWinnerPair(prev);
  const challenger = rowToIquitPair(
    db.prepare('SELECT * FROM iquit_pairs WHERE id = ?').get(row.challenger_pair_id)
  );

  if (!holder || !challenger) return { blackPair: null, yellowPair: null };

  if (holder.team === 'black') {
    return { blackPair: holder, yellowPair: challenger };
  }
  return { blackPair: challenger, yellowPair: holder };
}

function rowToIquitMatch(row, matchById) {
  const { blackPair, yellowPair } = resolveMatchSides(row, matchById);
  const blackScore = row.black_score ?? null;
  const yellowScore = row.yellow_score ?? null;

  return {
    id: row.id,
    batch: row.batch,
    sequence: row.sequence,
    blackPair,
    yellowPair,
    blackScore,
    yellowScore,
    completed: blackScore !== null && yellowScore !== null,
    isKingOfCourt: Boolean(row.holder_from_match_id),
    ready: Boolean(blackPair && yellowPair),
  };
}

function getBatchPairCount(batch) {
  return db.prepare(`SELECT COUNT(*) AS n FROM iquit_pairs WHERE batch = ?`).get(batch).n;
}

function getBatchMatchCount(batch) {
  return db.prepare(`SELECT COUNT(*) AS n FROM iquit_matches WHERE batch = ?`).get(batch).n;
}

export function getFullIquitState() {
  const pairRows = db.prepare(`SELECT * FROM iquit_pairs ORDER BY batch, team, id`).all();
  const pairs = pairRows.map(rowToIquitPair);
  const batch1Pairs = pairs.filter((p) => p.batch === BATCH_1);
  const batch2Pairs = pairs.filter((p) => p.batch === BATCH_2);

  const matchRows = db.prepare(`SELECT * FROM iquit_matches ORDER BY sequence, id`).all();

  const matchById = new Map();
  const matches = [];
  for (const row of matchRows) {
    const match = rowToIquitMatch(row, matchById);
    matchById.set(row.id, match);
    matches.push(match);
  }

  const lastCompleted = [...matches].reverse().find((m) => m.completed);
  const courtHolder = lastCompleted ? getWinnerPair(lastCompleted) : null;

  return {
    pairs,
    batch1Pairs,
    batch2Pairs,
    matches,
    pairsDrawn: batch1Pairs.length > 0,
    matchesDrawn: getBatchMatchCount(BATCH_1) > 0,
    batch2PairsDrawn: batch2Pairs.length > 0,
    batch2MatchesDrawn: getBatchMatchCount(BATCH_2) > 0,
    courtHolder,
    allCompleted: matches.length > 0 && matches.every((m) => m.completed),
  };
}

export function getIquitState() {
  return getFullIquitState();
}

function drawIquitPairsForBatch(batch, eliminatedPlayerIds) {
  if (getBatchPairCount(batch) > 0) {
    return { error: 'Le coppie iQuit sono già state estratte per questo turno.', status: 409 };
  }

  if (!eliminatedPlayerIds?.length) {
    return { error: 'Nessun giocatore eliminato disponibile.', status: 400 };
  }

  const players = eliminatedPlayerIds.map((id) => getPlayerById(id)).filter(Boolean);
  const blackPlayers = players.filter((p) => p.team === 'black');
  const yellowPlayers = players.filter((p) => p.team === 'yellow');

  if (blackPlayers.length < 2 || yellowPlayers.length < 2) {
    return {
      error: `Servono almeno 2 eliminati per squadra (Black: ${blackPlayers.length}, Yellow: ${yellowPlayers.length}).`,
      status: 400,
    };
  }

  const blackPairs = formPairsForTeam(blackPlayers);
  const yellowPairs = formPairsForTeam(yellowPlayers);
  const now = Date.now();

  const insert = db.prepare(
    `INSERT INTO iquit_pairs (batch, team, player1_id, player2_id, mixed, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    for (const pair of blackPairs) {
      insert.run(batch, 'black', pair.player1.id, pair.player2.id, pair.mixed ? 1 : 0, now);
    }
    for (const pair of yellowPairs) {
      insert.run(batch, 'yellow', pair.player1.id, pair.player2.id, pair.mixed ? 1 : 0, now);
    }
  });

  tx();
  return { state: getFullIquitState() };
}

export function drawIquitPairs(eliminatedPlayerIds) {
  return drawIquitPairsForBatch(BATCH_1, eliminatedPlayerIds);
}

export function drawIquitPairsBatch2(eliminatedPlayerIds) {
  if (getBatchPairCount(BATCH_1) === 0) {
    return { error: 'Estrai prima le coppie iQuit degli eliminati di Fase 1.', status: 400 };
  }
  return drawIquitPairsForBatch(BATCH_2, eliminatedPlayerIds);
}

function createOpeningBracket(batch, blackRows, yellowRows) {
  const blackShuffled = shuffle(blackRows);
  const yellowShuffled = shuffle(yellowRows);
  const openBlack = blackShuffled[0];
  const openYellow = yellowShuffled[0];
  const remaining = shuffle([...blackShuffled.slice(1), ...yellowShuffled.slice(1)]);

  const now = Date.now();
  const insert = db.prepare(
    `INSERT INTO iquit_matches
      (batch, sequence, black_pair_id, yellow_pair_id, holder_from_match_id, challenger_pair_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  let seq = db.prepare(`SELECT COALESCE(MAX(sequence), 0) AS n FROM iquit_matches`).get().n;

  const tx = db.transaction(() => {
    seq += 1;
    const m1 = insert.run(batch, seq, openBlack.id, openYellow.id, null, null, now);
    let prevId = m1.lastInsertRowid;

    for (const challenger of remaining) {
      seq += 1;
      const result = insert.run(batch, seq, null, null, prevId, challenger.id, now);
      prevId = result.lastInsertRowid;
    }
  });

  tx();
}

export function drawIquitMatches() {
  if (getBatchPairCount(BATCH_1) === 0) {
    return { error: 'Estrai prima le coppie iQuit.', status: 400 };
  }
  if (getBatchMatchCount(BATCH_1) > 0) {
    return { error: 'I match iQuit sono già stati sorteggiati.', status: 409 };
  }

  const blackRows = db
    .prepare(`SELECT * FROM iquit_pairs WHERE batch = ? AND team = 'black'`)
    .all(BATCH_1);
  const yellowRows = db
    .prepare(`SELECT * FROM iquit_pairs WHERE batch = ? AND team = 'yellow'`)
    .all(BATCH_1);

  createOpeningBracket(BATCH_1, blackRows, yellowRows);
  return { state: getFullIquitState() };
}

export function drawIquitMatchesBatch2() {
  if (getBatchPairCount(BATCH_2) === 0) {
    return { error: 'Estrai prima le coppie degli eliminati di Fase 2.', status: 400 };
  }
  if (getBatchMatchCount(BATCH_2) > 0) {
    return { error: 'I match iQuit Fase 2 sono già stati sorteggiati.', status: 409 };
  }
  if (getBatchMatchCount(BATCH_1) === 0) {
    return { error: 'Avvia prima il torneo iQuit con gli eliminati di Fase 1.', status: 400 };
  }

  const lastMatch = db
    .prepare(`SELECT * FROM iquit_matches ORDER BY sequence DESC LIMIT 1`)
    .get();
  if (!lastMatch) {
    return { error: 'Nessun match iQuit precedente trovato.', status: 400 };
  }

  const batch2PairRows = db.prepare(`SELECT * FROM iquit_pairs WHERE batch = ?`).all(BATCH_2);
  const challengers = shuffle(batch2PairRows);

  const now = Date.now();
  const insert = db.prepare(
    `INSERT INTO iquit_matches
      (batch, sequence, black_pair_id, yellow_pair_id, holder_from_match_id, challenger_pair_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  let seq = lastMatch.sequence;
  let prevId = lastMatch.id;

  const tx = db.transaction(() => {
    for (const challenger of challengers) {
      seq += 1;
      const result = insert.run(BATCH_2, seq, null, null, prevId, challenger.id, now);
      prevId = result.lastInsertRowid;
    }
  });

  tx();
  return { state: getFullIquitState() };
}

export function updateIquitMatchResult(matchId, { blackScore, yellowScore }) {
  const black = Number(blackScore);
  const yellow = Number(yellowScore);

  if (
    !Number.isInteger(black) ||
    !Number.isInteger(yellow) ||
    black < 0 ||
    yellow < 0 ||
    black > 99 ||
    yellow > 99
  ) {
    return { error: 'Inserisci punteggi validi (0–99).', status: 400 };
  }

  const row = db.prepare('SELECT * FROM iquit_matches WHERE id = ?').get(matchId);
  if (!row) {
    return { error: 'Match iQuit non trovato.', status: 404 };
  }

  if (row.holder_from_match_id) {
    const prevRow = db
      .prepare('SELECT * FROM iquit_matches WHERE id = ?')
      .get(row.holder_from_match_id);
    if (!prevRow || prevRow.black_score === null || prevRow.yellow_score === null) {
      return { error: 'Registra prima il risultato del match precedente.', status: 400 };
    }
  }

  db.prepare(
    `UPDATE iquit_matches SET black_score = ?, yellow_score = ? WHERE id = ?`
  ).run(black, yellow, matchId);

  return { state: getFullIquitState() };
}

export function resetIquit() {
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM iquit_matches`).run();
    db.prepare(`DELETE FROM iquit_pairs`).run();
  });
  tx();
  return { state: getFullIquitState() };
}
