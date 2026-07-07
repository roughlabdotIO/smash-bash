const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Errore di rete.');
  }
  return data;
}

export function fetchRoster() {
  return request('/api/roster');
}

export function registerPlayer(body) {
  return request('/api/players', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function drawPlayer(id) {
  return request(`/api/players/${id}/draw`, { method: 'POST' });
}

export function fetchTournament() {
  return request('/api/tournament');
}

export function fetchFase1() {
  return request('/api/tournament/fase-1');
}

export function drawFase1Pairs() {
  return request('/api/tournament/fase-1/draw-pairs', { method: 'POST' });
}

export function drawFase1Gironi() {
  return request('/api/tournament/fase-1/draw-gironi', { method: 'POST' });
}

export function drawFase1Matches() {
  return request('/api/tournament/fase-1/draw-matches', { method: 'POST' });
}

export function resetFase1() {
  return request('/api/tournament/fase-1/reset', { method: 'POST' });
}

export function drawFase2Pairs() {
  return request('/api/tournament/fase-2/draw-pairs', { method: 'POST' });
}

export function drawFase2Gironi() {
  return request('/api/tournament/fase-2/draw-gironi', { method: 'POST' });
}

export function drawFase2Matches() {
  return request('/api/tournament/fase-2/draw-matches', { method: 'POST' });
}

export function resetFase2() {
  return request('/api/tournament/fase-2/reset', { method: 'POST' });
}

export function drawIquitPairs() {
  return request('/api/tournament/iquit/draw-pairs', { method: 'POST' });
}

export function drawIquitMatches() {
  return request('/api/tournament/iquit/draw-matches', { method: 'POST' });
}

export function resetIquit() {
  return request('/api/tournament/iquit/reset', { method: 'POST' });
}

export function drawFinalePairs() {
  return request('/api/tournament/finale/draw-pairs', { method: 'POST' });
}

export function drawFinaleSemifinals() {
  return request('/api/tournament/finale/draw-semifinals', { method: 'POST' });
}

export function drawFinaleTiebreak() {
  return request('/api/tournament/finale/draw-tiebreak', { method: 'POST' });
}

export function resetFinale() {
  return request('/api/tournament/finale/reset', { method: 'POST' });
}

export function drawIquitPairsBatch2() {
  return request('/api/tournament/iquit/draw-pairs-batch2', { method: 'POST' });
}

export function drawIquitMatchesBatch2() {
  return request('/api/tournament/iquit/draw-matches-batch2', { method: 'POST' });
}

export function updateMatchResult(id, blackScore, yellowScore) {
  return request(`/api/tournament/matches/${id}/result`, {
    method: 'PATCH',
    body: JSON.stringify({ blackScore, yellowScore }),
  });
}

export function updateIquitMatchResult(id, blackScore, yellowScore) {
  return request(`/api/tournament/iquit/matches/${id}/result`, {
    method: 'PATCH',
    body: JSON.stringify({ blackScore, yellowScore }),
  });
}
