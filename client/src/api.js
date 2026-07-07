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
