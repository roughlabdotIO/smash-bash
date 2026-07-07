/**
 * Allinea Fase 3 (fase-finale) al calendario reale in campo.
 * Esegui sul Pi: docker exec smash-bash node scripts/seed-fase3.mjs
 */
import { db } from '../src/db.js';

const PHASE = 'fase-finale';
const now = Date.now();

function resolvePlayer(nome, cognome) {
  const tries = [[nome, cognome]];
  if (cognome === 'Cocchione') tries.push([nome, 'Cocchioni']);
  if (nome === 'Mirko') tries.push(['Mirco', cognome]);
  if (nome === 'Mirco') tries.push(['Mirko', cognome]);
  if (cognome === 'Ficiarà') tries.push([nome, 'Ficiara']);

  for (const [n, c] of tries) {
    const row = db
      .prepare(
        `SELECT id, nome, cognome, team, sesso FROM players
         WHERE cognome = ? COLLATE NOCASE AND nome = ? COLLATE NOCASE`
      )
      .get(c, n);
    if (row) {
      if (!row.team) throw new Error(`Giocatore senza squadra: ${n} ${c}`);
      return row;
    }
  }

  throw new Error(`Giocatore non trovato: ${nome} ${cognome}`);
}

function makePair(n1, c1, n2, c2) {
  const p1 = resolvePlayer(n1, c1);
  const p2 = resolvePlayer(n2, c2);
  if (p1.team !== p2.team) {
    throw new Error(
      `Coppia stesso team violata: ${p1.nome} ${p1.cognome} (${p1.team}) + ${p2.nome} ${p2.cognome} (${p2.team})`
    );
  }
  return {
    p1,
    p2,
    team: p1.team,
    label: `${p1.nome} ${p1.cognome} - ${p2.nome} ${p2.cognome}`,
  };
}

function insertPair(pair, girone) {
  const mixed = pair.p1.sesso !== pair.p2.sesso ? 1 : 0;
  const result = db
    .prepare(
      `INSERT INTO tournament_pairs (phase, team, player1_id, player2_id, mixed, girone, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(PHASE, pair.team, pair.p1.id, pair.p2.id, mixed, girone, now);
  return result.lastInsertRowid;
}

function insertMatch(girone, blackPairId, yellowPairId) {
  db.prepare(
    `INSERT INTO tournament_matches (phase, girone, black_pair_id, yellow_pair_id, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(PHASE, girone, blackPairId, yellowPairId, now);
}

// Calendario reale — ogni match: coppia A vs coppia B (ordine come dettato in campo)
const SCHEDULE = [
  {
    girone: 'A',
    matches: [
      [
        ['Francesco', 'Ansevini', 'Simona', 'Spoletini'],
        ['Mirco', 'Tosti', 'Francesca', 'Schirillo'],
      ],
      [
        ['Mirko', 'Capomasi', 'Clarissa', 'Mancinelli'],
        ['Luca', 'Falappa', 'Martina', 'Garrapa'],
      ],
    ],
  },
  {
    girone: 'B',
    matches: [
      [
        ['Francesco', 'Cocchione', 'Francesco', 'Severini'],
        ['Emanuele', 'Poeta', 'Elisa', 'Ficiarà'],
      ],
      [
        ['Camilla', 'Crescenzi', 'Fabrizio', 'Ippoliti'],
        ['Michele', 'Riccini', 'Jessica', 'Santolini'],
      ],
    ],
  },
];

function matchSides([a, b]) {
  const pairA = makePair(a[0], a[1], a[2], a[3]);
  const pairB = makePair(b[0], b[1], b[2], b[3]);
  if (pairA.team === pairB.team) {
    throw new Error(`Match stesso team: ${pairA.label} vs ${pairB.label}`);
  }
  const black = pairA.team === 'black' ? pairA : pairB;
  const yellow = pairA.team === 'yellow' ? pairA : pairB;
  return { black, yellow };
}

function main() {
  console.log('=== Seed Fase 3 ===\n');

  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM tournament_matches WHERE phase = ?`).run(PHASE);
    db.prepare(`DELETE FROM tournament_pairs WHERE phase = ?`).run(PHASE);

    for (const block of SCHEDULE) {
      console.log(`--- Girone ${block.girone} ---`);
      for (const def of block.matches) {
        const { black, yellow } = matchSides(def);
        const blackId = insertPair(black, block.girone);
        const yellowId = insertPair(yellow, block.girone);
        insertMatch(block.girone, blackId, yellowId);

        console.log(`  Black:  ${black.label}`);
        console.log(`  Yellow: ${yellow.label}`);
        console.log('');
      }
    }
  });

  tx();

  const pairs = db.prepare(`SELECT COUNT(*) AS n FROM tournament_pairs WHERE phase = ?`).get(PHASE).n;
  const gironi = db
    .prepare(`SELECT COUNT(*) AS n FROM tournament_pairs WHERE phase = ? AND girone IS NOT NULL`)
    .get(PHASE).n;
  const matches = db.prepare(`SELECT COUNT(*) AS n FROM tournament_matches WHERE phase = ?`).get(PHASE).n;

  console.log(`Verifica: ${pairs} coppie / ${gironi} con girone / ${matches} match`);
  console.log('Target 8 / 8 / 4 —', pairs === 8 && gironi === 8 && matches === 4 ? 'OK' : 'ERRORE');
}

try {
  main();
} catch (err) {
  console.error('ERRORE:', err.message);
  process.exit(1);
}
