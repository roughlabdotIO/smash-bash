import {
  drawFinalePairs,
  drawFinaleGironi,
  drawFinaleMatches,
  getTournamentState,
} from '../src/tournamentService.js';

function printSchedule(state) {
  const finale = state.finale;
  console.log('\n=== FASE 3 — SORTEGGIO COMPLETATO ===\n');

  if (finale.pairsDrawn && !finale.gironiDrawn) {
    console.log('Coppie estratte (gironi non ancora assegnati):');
    for (const pair of finale.pairs) {
      console.log(`  [${pair.team}] ${pair.label}`);
    }
    return;
  }

  for (const label of ['A', 'B']) {
    const girone = label === 'A' ? finale.gironeA : finale.gironeB;
    console.log(`--- GIRONE ${label} ---`);
    console.log('Coppie:');
    for (const pair of girone.pairs) {
      console.log(`  [${pair.team}] ${pair.label}`);
    }
    if (girone.matches.length) {
      console.log('Match:');
      for (const match of girone.matches) {
        console.log(`  Black: ${match.blackPair.label}`);
        console.log(`  vs Yellow: ${match.yellowPair.label}`);
        console.log('');
      }
    }
  }
}

function runStep(name, fn) {
  const result = fn();
  if (result.error) {
    console.error(`ERRORE (${name}):`, result.error);
    process.exit(1);
  }
  return result.state;
}

let state = getTournamentState();
const f = state.finale;

if (!f.pairsDrawn) {
  console.log('1/3 Estrazione coppie...');
  state = runStep('draw-pairs', drawFinalePairs);
} else {
  console.log('Coppie già estratte, salto step 1.');
}

if (!state.finale.gironiDrawn) {
  console.log('2/3 Estrazione gironi...');
  state = runStep('draw-gironi', drawFinaleGironi);
} else {
  console.log('Gironi già estratti, salto step 2.');
}

if (!state.finale.matchesDrawn) {
  console.log('3/3 Sorteggio match...');
  state = runStep('draw-matches', drawFinaleMatches);
} else {
  console.log('Match già sorteggiati, salto step 3.');
}

printSchedule(getTournamentState());
