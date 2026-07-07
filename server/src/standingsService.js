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

function computeStandingsForPhase(phaseState) {
  if (!allPhaseMatchesCompleted(phaseState)) {
    return { ready: false };
  }

  const playerStats = new Map();

  for (const pair of phaseState.pairs) {
    for (const player of [pair.player1, pair.player2]) {
      playerStats.set(player.id, {
        player,
        points: 0,
        girone: pair.girone,
        team: pair.team,
        eliminated: false,
      });
    }
  }

  const matches = [...phaseState.gironeA.matches, ...phaseState.gironeB.matches];
  for (const match of matches) {
    const bp = match.blackPair;
    const yp = match.yellowPair;
    for (const id of [bp.player1.id, bp.player2.id]) {
      const stat = playerStats.get(id);
      if (stat) stat.points += match.blackScore;
    }
    for (const id of [yp.player1.id, yp.player2.id]) {
      const stat = playerStats.get(id);
      if (stat) stat.points += match.yellowScore;
    }
  }

  const eliminatedIds = new Set();

  for (const girone of ['A', 'B']) {
    for (const team of ['black', 'yellow']) {
      for (const sesso of ['M', 'F']) {
        const group = [...playerStats.values()]
          .filter(
            (s) => s.girone === girone && s.team === team && s.player.sesso === sesso
          )
          .sort((a, b) => {
            if (a.points !== b.points) return a.points - b.points;
            return a.player.cognome.localeCompare(b.player.cognome, 'it');
          });

        group.slice(0, 2).forEach((s) => {
          eliminatedIds.add(s.player.id);
          s.eliminated = true;
        });
      }
    }
  }

  function buildTeam(team) {
    const rows = [...playerStats.values()]
      .filter((s) => s.team === team)
      .sort((a, b) => {
        if (a.girone !== b.girone) return a.girone.localeCompare(b.girone);
        if (a.points !== b.points) return b.points - a.points;
        return a.player.cognome.localeCompare(b.player.cognome, 'it');
      })
      .map((s) => ({
        id: s.player.id,
        nome: s.player.nome,
        cognome: s.player.cognome,
        sesso: s.player.sesso,
        girone: s.girone,
        points: s.points,
        eliminated: s.eliminated,
      }));

    return {
      rows,
      eliminated: rows.filter((r) => r.eliminated),
      active: rows.filter((r) => !r.eliminated),
    };
  }

  return {
    ready: true,
    black: buildTeam('black'),
    yellow: buildTeam('yellow'),
    eliminatedIds: [...eliminatedIds],
  };
}

export function computeFase1Standings(fase1State) {
  return computeStandingsForPhase(fase1State);
}

export function computeFase2Standings(fase2State) {
  return computeStandingsForPhase(fase2State);
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
