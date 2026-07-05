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
