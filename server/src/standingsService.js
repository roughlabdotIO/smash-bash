import { db } from './db.js';

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

function getPlayerById(id) {
  return db.prepare('SELECT * FROM players WHERE id = ?').get(id);
}

function allPhaseMatchesCompleted(phaseState) {
  if (!phaseState.matchesDrawn) return false;
  const matches = [...phaseState.gironeA.matches, ...phaseState.gironeB.matches];
  return matches.length > 0 && matches.every((m) => m.completed);
}

function buildTeamRows(playerStats, team) {
  const rows = [...playerStats.values()]
    .filter((s) => s.team === team)
    .sort((a, b) => {
      if (a.girone !== b.girone) return a.girone.localeCompare(b.girone);
      if (a.pointsScored !== b.pointsScored) return b.pointsScored - a.pointsScored;
      if (a.pointsConceded !== b.pointsConceded) return a.pointsConceded - b.pointsConceded;
      return a.player.cognome.localeCompare(b.player.cognome, 'it');
    })
    .map((s) => ({
      id: s.player.id,
      nome: s.player.nome,
      cognome: s.player.cognome,
      sesso: s.player.sesso,
      girone: s.girone,
      points: s.pointsScored,
      pointsScored: s.pointsScored,
      pointsConceded: s.pointsConceded,
      pointsDiff: s.pointsScored - s.pointsConceded,
      eliminated: s.eliminated,
      eliminatedOnTiebreak: s.eliminatedOnTiebreak,
    }));

  return {
    rows,
    eliminated: rows.filter((r) => r.eliminated),
    active: rows.filter((r) => !r.eliminated),
  };
}

function applyEliminations(playerStats) {
  const eliminatedIds = new Set();

  for (const team of ['black', 'yellow']) {
    for (const sesso of ['M', 'F']) {
      const group = [...playerStats.values()]
        .filter((s) => s.team === team && s.player.sesso === sesso)
        .sort((a, b) => {
          if (a.pointsScored !== b.pointsScored) return a.pointsScored - b.pointsScored;
          if (a.pointsConceded !== b.pointsConceded) return b.pointsConceded - a.pointsConceded;
          return a.player.cognome.localeCompare(b.player.cognome, 'it');
        });

      group.slice(0, 2).forEach((s) => {
        eliminatedIds.add(s.player.id);
        s.eliminated = true;
        const tiedOnPoints = group.filter((g) => g.pointsScored === s.pointsScored);
        if (tiedOnPoints.length > 1) {
          s.eliminatedOnTiebreak = true;
        }
      });
    }
  }

  return eliminatedIds;
}

function addMatchPoints(playerStats, match) {
  const bp = match.blackPair;
  const yp = match.yellowPair;

  for (const id of [bp.player1.id, bp.player2.id]) {
    const stat = playerStats.get(id);
    if (stat) {
      stat.pointsScored += match.blackScore;
      stat.pointsConceded += match.yellowScore;
    }
  }
  for (const id of [yp.player1.id, yp.player2.id]) {
    const stat = playerStats.get(id);
    if (stat) {
      stat.pointsScored += match.yellowScore;
      stat.pointsConceded += match.blackScore;
    }
  }
}

function getPhaseMatches(phaseState) {
  return [...phaseState.gironeA.matches, ...phaseState.gironeB.matches];
}

function addCompletedMatchPoints(playerStats, phaseState) {
  for (const match of getPhaseMatches(phaseState)) {
    if (!match.completed) continue;
    addMatchPoints(playerStats, match);
  }
}

export function computeLiveStandings(phaseState, priorPhaseState = null) {
  if (!phaseState.gironiDrawn || phaseState.pairs.length === 0) {
    return { available: false };
  }

  const playerStats = new Map();
  const cumulative = Boolean(priorPhaseState);

  for (const pair of phaseState.pairs) {
    for (const player of [pair.player1, pair.player2]) {
      playerStats.set(player.id, {
        player,
        pointsScored: 0,
        pointsConceded: 0,
        girone: pair.girone,
        team: pair.team,
        eliminated: false,
        eliminatedOnTiebreak: false,
      });
    }
  }

  if (priorPhaseState) {
    addCompletedMatchPoints(playerStats, priorPhaseState);
  }

  const matches = getPhaseMatches(phaseState);
  addCompletedMatchPoints(playerStats, phaseState);

  const matchesPlayed = matches.filter((m) => m.completed).length;
  const matchesTotal = matches.length;
  const allComplete = phaseState.matchesDrawn && matchesTotal > 0 && matchesPlayed === matchesTotal;

  let eliminatedIds = [];
  if (allComplete) {
    eliminatedIds = [...applyEliminations(playerStats)];
  }

  return {
    available: true,
    ready: allComplete,
    cumulative,
    matchesPlayed,
    matchesTotal,
    black: buildTeamRows(playerStats, 'black'),
    yellow: buildTeamRows(playerStats, 'yellow'),
    eliminatedIds,
  };
}

function computeStandingsForPhase(phaseState, priorPhaseState = null) {
  const live = computeLiveStandings(phaseState, priorPhaseState);
  if (!live.available || !live.ready) {
    return { ready: false };
  }
  return live;
}

export function computeFase1Standings(fase1State) {
  return computeStandingsForPhase(fase1State);
}

export function computeFase2Standings(fase2State, fase1State) {
  return computeStandingsForPhase(fase2State, fase1State);
}

export function getRankingState(fase1State, fase2State) {
  return {
    fase1: computeLiveStandings(fase1State),
    fase2: computeLiveStandings(fase2State, fase1State),
  };
}

export function getActivePlayerIds(standings) {
  if (!standings?.ready) return null;
  const all = db.prepare(`SELECT id FROM players WHERE team IS NOT NULL`).all();
  const eliminated = new Set(standings.eliminatedIds);
  return all.map((p) => p.id).filter((id) => !eliminated.has(id));
}

export function getActivePlayerIdsAfterFase2(fase1Standings, fase2Standings) {
  if (!fase1Standings?.ready || !fase2Standings?.ready) return null;
  const eliminated = new Set([
    ...fase1Standings.eliminatedIds,
    ...fase2Standings.eliminatedIds,
  ]);
  const all = db.prepare(`SELECT id FROM players WHERE team IS NOT NULL`).all();
  return all.map((p) => p.id).filter((id) => !eliminated.has(id));
}

export { formatPlayer, getPlayerById, allPhaseMatchesCompleted };
