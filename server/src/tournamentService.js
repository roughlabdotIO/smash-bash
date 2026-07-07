import { db } from './db.js';
import {
  computeFase1Standings,
  computeFase2Standings,
  getRankingState,
  getActivePlayerIds,
  getActivePlayerIdsAfterFase2,
  formatPlayer,
  getPlayerById,
} from './standingsService.js';
import {
  getFullIquitState,
  drawIquitPairs,
  drawIquitMatches,
  drawIquitPairsBatch2,
  drawIquitMatchesBatch2,
  resetIquit,
  updateIquitMatchResult,
} from './iquitService.js';

const FASE1 = 'fase-1';
const FASE2 = 'fase-2';
const FASE_FINALE = 'fase-finale';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pairKey(id1, id2) {
  return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
}

function isForbiddenPair(p1, p2, forbidden) {
  return forbidden.has(pairKey(p1.id, p2.id));
}

function getForbiddenPairsFromPhase(phase) {
  const rows = db
    .prepare(`SELECT player1_id, player2_id FROM tournament_pairs WHERE phase = ?`)
    .all(phase);
  const forbidden = new Set();
  for (const row of rows) {
    forbidden.add(pairKey(row.player1_id, row.player2_id));
  }
  return forbidden;
}

function formMixedPairs(males, females, forbidden) {
  const n = Math.min(males.length, females.length);
  if (n === 0) {
    return { mixed: [], leftoverM: males, leftoverF: females };
  }

  const mList = shuffle(males);
  const fList = shuffle(females);

  function search(mIdx, fUsed, pairs) {
    if (mIdx === n) return pairs;
    const male = mList[mIdx];
    const options = [];
    for (let j = 0; j < n; j += 1) {
      if (fUsed.has(j)) continue;
      if (!isForbiddenPair(male, fList[j], forbidden)) options.push(j);
    }
    shuffle(options);
    for (const j of options) {
      fUsed.add(j);
      const result = search(mIdx + 1, fUsed, [
        ...pairs,
        { player1: male, player2: fList[j], mixed: true },
      ]);
      if (result) return result;
      fUsed.delete(j);
    }
    return null;
  }

  const mixed = search(0, new Set(), []);
  if (!mixed) return null;

  const pairedMaleIds = new Set(mixed.map((p) => p.player1.id));
  const pairedFemaleIds = new Set(mixed.map((p) => p.player2.id));

  return {
    mixed,
    leftoverM: males.filter((p) => !pairedMaleIds.has(p.id)),
    leftoverF: females.filter((p) => !pairedFemaleIds.has(p.id)),
  };
}

function formSameSexPairs(players, forbidden) {
  if (players.length === 0) return [];
  if (players.length % 2 !== 0) return null;

  const list = shuffle(players);
  const used = new Array(list.length).fill(false);

  function pairRemaining(pairs) {
    let start = -1;
    for (let i = 0; i < list.length; i += 1) {
      if (!used[i]) {
        start = i;
        break;
      }
    }
    if (start === -1) return pairs;

    const options = [];
    for (let j = start + 1; j < list.length; j += 1) {
      if (!used[j] && !isForbiddenPair(list[start], list[j], forbidden)) {
        options.push(j);
      }
    }
    shuffle(options);
    for (const j of options) {
      used[start] = true;
      used[j] = true;
      const result = pairRemaining([
        ...pairs,
        { player1: list[start], player2: list[j], mixed: false },
      ]);
      if (result) return result;
      used[start] = false;
      used[j] = false;
    }
    return null;
  }

  return pairRemaining([]);
}

function formPairsForTeamOnce(players, forbidden) {
  const males = players.filter((p) => p.sesso === 'M');
  const females = players.filter((p) => p.sesso === 'F');

  const mixedResult = formMixedPairs(males, females, forbidden);
  if (!mixedResult) return null;

  const mmPairs = formSameSexPairs(mixedResult.leftoverM, forbidden);
  if (!mmPairs) return null;
  const ffPairs = formSameSexPairs(mixedResult.leftoverF, forbidden);
  if (!ffPairs) return null;

  return [...mixedResult.mixed, ...mmPairs, ...ffPairs];
}

function formPairsForTeam(players, forbidden = new Set()) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const pairs = formPairsForTeamOnce(players, forbidden);
    if (pairs) return pairs;
  }
  return null;
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
    label: `${p1.nome} ${p1.cognome} - ${p2.nome} ${p2.cognome}`,
  };
}

function rowToMatch(row) {
  const blackPair = db.prepare('SELECT * FROM tournament_pairs WHERE id = ?').get(row.black_pair_id);
  const yellowPair = db.prepare('SELECT * FROM tournament_pairs WHERE id = ?').get(row.yellow_pair_id);
  const blackScore = row.black_score ?? null;
  const yellowScore = row.yellow_score ?? null;
  return {
    id: row.id,
    phase: row.phase,
    girone: row.girone,
    matchLabel: row.match_label ?? null,
    blackPair: rowToPair(blackPair),
    yellowPair: rowToPair(yellowPair),
    blackScore,
    yellowScore,
    completed: blackScore !== null && yellowScore !== null,
  };
}

function getStateFlags(phase) {
  const pairsCount = db
    .prepare(`SELECT COUNT(*) AS n FROM tournament_pairs WHERE phase = ?`)
    .get(phase).n;
  const gironiCount = db
    .prepare(
      `SELECT COUNT(*) AS n FROM tournament_pairs WHERE phase = ? AND girone IS NOT NULL`
    )
    .get(phase).n;
  const matchesCount = db
    .prepare(`SELECT COUNT(*) AS n FROM tournament_matches WHERE phase = ?`)
    .get(phase).n;

  return {
    pairsDrawn: pairsCount > 0,
    gironiDrawn: gironiCount > 0 && gironiCount === pairsCount,
    matchesDrawn: matchesCount > 0,
  };
}

function getPhaseState(phase) {
  const flags = getStateFlags(phase);
  const pairRows = db
    .prepare(`SELECT * FROM tournament_pairs WHERE phase = ? ORDER BY team, id`)
    .all(phase);
  let pairs = pairRows.map(rowToPair);

  if (phase === FASE2) {
    pairs = pairs.map((pair) => {
      const g1 = getPlayerFase1Girone(pair.player1.id);
      const g2 = getPlayerFase1Girone(pair.player2.id);
      const fase1Girone = g1 && g2 && g1 === g2 ? g1 : g1 || g2 || null;
      return {
        ...pair,
        fase1Girone,
        rotatedFrom: fase1Girone,
        rotatedTo: fase1Girone ? rotateGirone(fase1Girone) : pair.girone,
      };
    });
  }

  const matchRows = db
    .prepare(`SELECT * FROM tournament_matches WHERE phase = ? ORDER BY girone, id`)
    .all(phase);
  const matches = matchRows.map(rowToMatch);

  return {
    phase,
    ...flags,
    pairs,
    gironeA: {
      pairs: pairs.filter((p) => p.girone === 'A'),
      matches: matches.filter((m) => m.girone === 'A'),
    },
    gironeB: {
      pairs: pairs.filter((p) => p.girone === 'B'),
      matches: matches.filter((m) => m.girone === 'B'),
    },
  };
}

export function getFase1State() {
  return getPhaseState(FASE1);
}

export function getFase2State() {
  return getPhaseState(FASE2);
}

export function getTournamentState() {
  const fase1 = getPhaseState(FASE1);
  const fase2 = getPhaseState(FASE2);
  const standings = computeFase1Standings(fase1);
  const standingsFase2 = computeFase2Standings(fase2);

  return {
    fase1,
    fase2,
    standings,
    standingsFase2,
    ranking: getRankingState(fase1, fase2),
    finale: getFinaleState(),
    iquit: getFullIquitState(),
  };
}

function getWinnerPairFromMatch(match) {
  if (!match.completed) return null;
  if (match.blackScore > match.yellowScore) return match.blackPair;
  if (match.yellowScore > match.blackScore) return match.yellowPair;
  return null;
}

function getFinaleState() {
  const flags = getStateFlags(FASE_FINALE);
  const pairRows = db
    .prepare(`SELECT * FROM tournament_pairs WHERE phase = ? ORDER BY team, id`)
    .all(FASE_FINALE);
  const pairs = pairRows.map(rowToPair);

  const matchRows = db
    .prepare(`SELECT * FROM tournament_matches WHERE phase = ? ORDER BY id`)
    .all(FASE_FINALE);
  const matches = matchRows.map(rowToMatch);
  const semifinals = matches.filter((m) => m.matchLabel === 'semi-1' || m.matchLabel === 'semi-2');
  const tiebreak = matches.find((m) => m.matchLabel === 'tiebreak') ?? null;

  function teamChampionFromSemis(team) {
    for (const m of semifinals) {
      const winner = getWinnerPairFromMatch(m);
      if (winner?.team === team) return winner;
    }
    return null;
  }

  let blackChampion = teamChampionFromSemis('black');
  let yellowChampion = teamChampionFromSemis('yellow');

  if (tiebreak?.completed) {
    const tbWinner = getWinnerPairFromMatch(tiebreak);
    if (tbWinner?.team === 'black') blackChampion = tbWinner;
    if (tbWinner?.team === 'yellow') yellowChampion = tbWinner;
  }

  return {
    phase: FASE_FINALE,
    pairsDrawn: flags.pairsDrawn,
    semifinalsDrawn: semifinals.length === 2,
    tiebreakDrawn: Boolean(tiebreak),
    pairs,
    semifinals,
    tiebreak,
    blackChampion,
    yellowChampion,
  };
}

function getPlayerFase1Girone(playerId) {
  const row = db
    .prepare(
      `SELECT girone FROM tournament_pairs
       WHERE phase = ? AND girone IS NOT NULL
         AND (player1_id = ? OR player2_id = ?)`
    )
    .get(FASE1, playerId, playerId);
  return row?.girone ?? null;
}

function rotateGirone(girone) {
  if (girone === 'A') return 'B';
  if (girone === 'B') return 'A';
  return null;
}

function assignBlackGironiFase2(blackPairs) {
  const perGirone = blackPairs.length / 2;
  // Rotazione: chi era nel Girone A in Fase 1 va nel B (e viceversa)
  const items = shuffle(blackPairs).map((pair) => {
    const g1 = getPlayerFase1Girone(pair.player1_id);
    const g2 = getPlayerFase1Girone(pair.player2_id);

    if (g1 && g2 && g1 === g2) {
      return { pair, girone: rotateGirone(g1), flexible: false };
    }

    const ref = g1 || g2;
    return {
      pair,
      girone: ref ? rotateGirone(ref) : null,
      flexible: true,
    };
  });

  const assignedA = [];
  const assignedB = [];
  const pending = [];

  for (const item of items) {
    if (!item.flexible && item.girone === 'A') assignedA.push(item);
    else if (!item.flexible && item.girone === 'B') assignedB.push(item);
    else pending.push(item);
  }

  for (const item of pending) {
    if (assignedA.length < perGirone) {
      item.girone = 'A';
      assignedA.push(item);
    } else {
      item.girone = 'B';
      assignedB.push(item);
    }
  }

  while (assignedA.length > perGirone && assignedB.length < perGirone) {
    const moved = assignedA.pop();
    moved.girone = 'B';
    assignedB.push(moved);
  }
  while (assignedB.length > perGirone && assignedA.length < perGirone) {
    const moved = assignedB.pop();
    moved.girone = 'A';
    assignedA.push(moved);
  }

  return [...assignedA, ...assignedB];
}

function drawPairsForPhase(phase, playerIds = null) {
  const flags = getStateFlags(phase);
  if (flags.pairsDrawn) {
    return { error: 'Le coppie sono già state estratte.', status: 409 };
  }

  let players = db
    .prepare(`SELECT * FROM players WHERE team IS NOT NULL ORDER BY id`)
    .all();

  if (playerIds) {
    const allowed = new Set(playerIds);
    players = players.filter((p) => allowed.has(p.id));
  }

  const blackPlayers = players.filter((p) => p.team === 'black');
  const yellowPlayers = players.filter((p) => p.team === 'yellow');

  if (blackPlayers.length < 2 || yellowPlayers.length < 2) {
    return { error: 'Servono almeno 2 giocatori attivi per squadra.', status: 400 };
  }

  let forbidden = new Set();
  if (phase === FASE2) {
    forbidden = getForbiddenPairsFromPhase(FASE1);
  } else if (phase === FASE_FINALE) {
    forbidden = getForbiddenPairsFromPhase(FASE2);
  }

  const blackPairs = formPairsForTeam(blackPlayers, forbidden);
  const yellowPairs = formPairsForTeam(yellowPlayers, forbidden);

  if (!blackPairs || !yellowPairs) {
    return {
      error:
        'Impossibile formare coppie senza ripetere abbinamenti della fase precedente. Riprova il sorteggio.',
      status: 409,
    };
  }
  const now = Date.now();

  const insert = db.prepare(
    `INSERT INTO tournament_pairs (phase, team, player1_id, player2_id, mixed, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    for (const pair of blackPairs) {
      insert.run(phase, 'black', pair.player1.id, pair.player2.id, pair.mixed ? 1 : 0, now);
    }
    for (const pair of yellowPairs) {
      insert.run(phase, 'yellow', pair.player1.id, pair.player2.id, pair.mixed ? 1 : 0, now);
    }
  });

  tx();
  return { state: getTournamentState() };
}

export function drawPairs() {
  return drawPairsForPhase(FASE1);
}

export function drawPairsFase2() {
  const fase1 = getPhaseState(FASE1);
  const standings = computeFase1Standings(fase1);
  if (!standings.ready) {
    return { error: 'Inserisci tutti i risultati della Fase 1 prima di continuare.', status: 400 };
  }

  const activeIds = getActivePlayerIds(standings);
  return drawPairsForPhase(FASE2, activeIds);
}

function drawGironiForPhase(phase, assignBlack) {
  const flags = getStateFlags(phase);
  if (!flags.pairsDrawn) {
    return { error: 'Estrai prima le coppie.', status: 400 };
  }
  if (flags.gironiDrawn) {
    return { error: 'I gironi sono già stati estratti.', status: 409 };
  }

  const blackPairs = db
    .prepare(`SELECT * FROM tournament_pairs WHERE phase = ? AND team = 'black'`)
    .all(phase);
  const yellowPairs = db
    .prepare(`SELECT * FROM tournament_pairs WHERE phase = ? AND team = 'yellow'`)
    .all(phase);

  if (blackPairs.length !== yellowPairs.length || blackPairs.length < 2 || blackPairs.length % 2 !== 0) {
    return {
      error: `Numero coppie non valido (Black: ${blackPairs.length}, Yellow: ${yellowPairs.length}).`,
      status: 400,
    };
  }

  const perGirone = blackPairs.length / 2;
  const yellowShuffled = shuffle(yellowPairs);
  const blackAssignments = assignBlack(blackPairs);
  const update = db.prepare(`UPDATE tournament_pairs SET girone = ? WHERE id = ?`);

  const tx = db.transaction(() => {
    yellowShuffled.forEach((pair, i) => {
      update.run(i < perGirone ? 'A' : 'B', pair.id);
    });
    blackAssignments.forEach(({ pair, girone }) => {
      update.run(girone, pair.id);
    });
  });

  tx();
  return { state: getTournamentState() };
}

export function drawGironi() {
  return drawGironiForPhase(FASE1, (blackPairs) => {
    const perGirone = blackPairs.length / 2;
    return shuffle(blackPairs).map((pair, i) => ({
      pair,
      girone: i < perGirone ? 'A' : 'B',
    }));
  });
}

export function drawGironiFase2() {
  const fase1 = getStateFlags(FASE1);
  if (!fase1.gironiDrawn) {
    return { error: 'Completa prima i gironi della Fase 1.', status: 400 };
  }
  return drawGironiForPhase(FASE2, assignBlackGironiFase2);
}

function drawMatchesForPhase(phase) {
  const flags = getStateFlags(phase);
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
          .all(phase, girone)
      );
      const yellowInGirone = shuffle(
        db
          .prepare(
            `SELECT * FROM tournament_pairs WHERE phase = ? AND girone = ? AND team = 'yellow'`
          )
          .all(phase, girone)
      );

      if (blackInGirone.length !== yellowInGirone.length || blackInGirone.length === 0) {
        throw new Error('GIRONI_INVALID');
      }

      for (let i = 0; i < blackInGirone.length; i += 1) {
        insert.run(phase, girone, blackInGirone[i].id, yellowInGirone[i].id, now);
      }
    }
  });

  try {
    tx();
  } catch (err) {
    if (err.message === 'GIRONI_INVALID') {
      return { error: 'Ogni girone deve avere lo stesso numero di coppie Black e Yellow.', status: 400 };
    }
    throw err;
  }

  return { state: getTournamentState() };
}

export function drawMatches() {
  return drawMatchesForPhase(FASE1);
}

export function drawMatchesFase2() {
  return drawMatchesForPhase(FASE2);
}

export function drawFinalePairs() {
  const fase2 = getPhaseState(FASE2);
  const standingsFase2 = computeFase2Standings(fase2);
  if (!standingsFase2.ready) {
    return { error: 'Inserisci tutti i risultati della Fase 2 prima di continuare.', status: 400 };
  }

  const activeIds = getActivePlayerIdsAfterFase2(
    computeFase1Standings(getPhaseState(FASE1)),
    standingsFase2
  );
  return drawPairsForPhase(FASE_FINALE, activeIds);
}

export function drawFinaleSemifinals() {
  const flags = getStateFlags(FASE_FINALE);
  if (!flags.pairsDrawn) {
    return { error: 'Estrai prima le coppie della finale.', status: 400 };
  }

  const existing = db
    .prepare(
      `SELECT COUNT(*) AS n FROM tournament_matches WHERE phase = ? AND match_label IN ('semi-1', 'semi-2')`
    )
    .get(FASE_FINALE).n;
  if (existing > 0) {
    return { error: 'Le semifinali sono già state sorteggiate.', status: 409 };
  }

  const blackPairs = shuffle(
    db.prepare(`SELECT * FROM tournament_pairs WHERE phase = ? AND team = 'black'`).all(FASE_FINALE)
  );
  const yellowPairs = shuffle(
    db.prepare(`SELECT * FROM tournament_pairs WHERE phase = ? AND team = 'yellow'`).all(FASE_FINALE)
  );

  if (blackPairs.length !== 2 || yellowPairs.length !== 2) {
    return {
      error: `Servono 2 coppie per squadra in finale (Black: ${blackPairs.length}, Yellow: ${yellowPairs.length}).`,
      status: 400,
    };
  }

  const now = Date.now();
  const insert = db.prepare(
    `INSERT INTO tournament_matches (phase, girone, black_pair_id, yellow_pair_id, match_label, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    insert.run(FASE_FINALE, 'A', blackPairs[0].id, yellowPairs[0].id, 'semi-1', now);
    insert.run(FASE_FINALE, 'B', blackPairs[1].id, yellowPairs[1].id, 'semi-2', now);
  });

  tx();
  return { state: getTournamentState() };
}

export function drawFinaleTiebreak() {
  const finale = getFinaleState();
  if (!finale.semifinalsDrawn) {
    return { error: 'Sorteggia prima le semifinali.', status: 400 };
  }
  if (finale.tiebreakDrawn) {
    return { error: 'Lo spareggio è già stato estratto.', status: 409 };
  }
  if (!finale.semifinals.every((m) => m.completed)) {
    return { error: 'Completa prima entrambe le semifinali.', status: 400 };
  }

  const blackPairs = shuffle(
    db.prepare(`SELECT * FROM tournament_pairs WHERE phase = ? AND team = 'black'`).all(FASE_FINALE)
  );
  const yellowPairs = shuffle(
    db.prepare(`SELECT * FROM tournament_pairs WHERE phase = ? AND team = 'yellow'`).all(FASE_FINALE)
  );

  const now = Date.now();
  db.prepare(
    `INSERT INTO tournament_matches (phase, girone, black_pair_id, yellow_pair_id, match_label, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(FASE_FINALE, 'A', blackPairs[0].id, yellowPairs[0].id, 'tiebreak', now);

  return { state: getTournamentState() };
}

export function updateMatchResult(matchId, { blackScore, yellowScore }) {
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

  const row = db.prepare('SELECT * FROM tournament_matches WHERE id = ?').get(matchId);
  if (!row) {
    return { error: 'Match non trovato.', status: 404 };
  }

  db.prepare(
    `UPDATE tournament_matches SET black_score = ?, yellow_score = ? WHERE id = ?`
  ).run(black, yellow, matchId);

  return { state: getTournamentState() };
}

export function startIquitPairs() {
  const fase1 = getPhaseState(FASE1);
  const standings = computeFase1Standings(fase1);
  if (!standings.ready) {
    return { error: 'Inserisci tutti i risultati della Fase 1.', status: 400 };
  }

  const fase2 = getStateFlags(FASE2);
  if (!fase2.gironiDrawn) {
    return { error: 'Estrai prima i gironi della Fase 2.', status: 400 };
  }

  const result = drawIquitPairs(standings.eliminatedIds);
  if (result.error) return result;
  return { state: getTournamentState() };
}

export function startIquitMatches() {
  const result = drawIquitMatches();
  if (result.error) return result;
  return { state: getTournamentState() };
}

export function updateIquitResult(matchId, scores) {
  const result = updateIquitMatchResult(matchId, scores);
  if (result.error) return result;
  return { state: getTournamentState() };
}

export function startIquitPairsBatch2() {
  const fase2 = getPhaseState(FASE2);
  const standingsFase2 = computeFase2Standings(fase2);
  if (!standingsFase2.ready) {
    return { error: 'Inserisci tutti i risultati della Fase 2.', status: 400 };
  }

  const result = drawIquitPairsBatch2(standingsFase2.eliminatedIds);
  if (result.error) return result;
  return { state: getTournamentState() };
}

export function startIquitMatchesBatch2() {
  const result = drawIquitMatchesBatch2();
  if (result.error) return result;
  return { state: getTournamentState() };
}

export function resetFase1() {
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM tournament_matches WHERE phase = ?`).run(FASE1);
    db.prepare(`DELETE FROM tournament_pairs WHERE phase = ?`).run(FASE1);
    db.prepare(`DELETE FROM tournament_matches WHERE phase = ?`).run(FASE2);
    db.prepare(`DELETE FROM tournament_pairs WHERE phase = ?`).run(FASE2);
    db.prepare(`DELETE FROM tournament_matches WHERE phase = ?`).run(FASE_FINALE);
    db.prepare(`DELETE FROM tournament_pairs WHERE phase = ?`).run(FASE_FINALE);
    db.prepare(`DELETE FROM iquit_matches`).run();
    db.prepare(`DELETE FROM iquit_pairs`).run();
  });
  tx();
  return { state: getTournamentState() };
}

export function resetFase2() {
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM tournament_matches WHERE phase = ?`).run(FASE2);
    db.prepare(`DELETE FROM tournament_pairs WHERE phase = ?`).run(FASE2);
    db.prepare(`DELETE FROM tournament_matches WHERE phase = ?`).run(FASE_FINALE);
    db.prepare(`DELETE FROM tournament_pairs WHERE phase = ?`).run(FASE_FINALE);
    db.prepare(`DELETE FROM iquit_matches WHERE batch = 2`).run();
    db.prepare(`DELETE FROM iquit_pairs WHERE batch = 2`).run();
  });
  tx();
  return { state: getTournamentState() };
}

export function resetFinale() {
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM tournament_matches WHERE phase = ?`).run(FASE_FINALE);
    db.prepare(`DELETE FROM tournament_pairs WHERE phase = ?`).run(FASE_FINALE);
  });
  tx();
  return { state: getTournamentState() };
}

export function resetIquitChamp() {
  resetIquit();
  return { state: getTournamentState() };
}
