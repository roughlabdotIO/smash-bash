import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { fetchFase1 } from '../api.js';

const SOCKET_URL = import.meta.env.VITE_API_URL || undefined;

const emptyState = {
  phase: 'fase-1',
  pairsDrawn: false,
  gironiDrawn: false,
  matchesDrawn: false,
  pairs: [],
  gironeA: { pairs: [], matches: [] },
  gironeB: { pairs: [], matches: [] },
};

export function useTournament() {
  const [state, setState] = useState(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    return fetchFase1()
      .then(setState)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));

    const socket = io(SOCKET_URL, { path: '/socket.io' });
    socket.on('tournament:update', setState);

    return () => socket.disconnect();
  }, [refresh]);

  return { state, loading, error, refresh };
}
