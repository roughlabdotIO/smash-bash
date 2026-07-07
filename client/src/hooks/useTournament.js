import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { fetchTournament } from '../api.js';

const SOCKET_URL = import.meta.env.VITE_API_URL || undefined;

const emptyPhaseState = {
  phase: '',
  pairsDrawn: false,
  gironiDrawn: false,
  matchesDrawn: false,
  pairs: [],
  gironeA: { pairs: [], matches: [] },
  gironeB: { pairs: [], matches: [] },
};

const emptyState = {
  fase1: { ...emptyPhaseState, phase: 'fase-1' },
  fase2: { ...emptyPhaseState, phase: 'fase-2' },
  standings: { ready: false },
  standingsFase2: { ready: false },
  finale: {
    phase: 'fase-finale',
    pairsDrawn: false,
    semifinalsDrawn: false,
    tiebreakDrawn: false,
    pairs: [],
    semifinals: [],
    tiebreak: null,
    blackChampion: null,
    yellowChampion: null,
  },
  iquit: {
    pairs: [],
    batch1Pairs: [],
    batch2Pairs: [],
    matches: [],
    pairsDrawn: false,
    matchesDrawn: false,
    batch2PairsDrawn: false,
    batch2MatchesDrawn: false,
    courtHolder: null,
    allCompleted: false,
  },
};

export function useTournament() {
  const [state, setState] = useState(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    return fetchTournament()
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
