import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { fetchRoster } from '../api.js';

const SOCKET_URL = import.meta.env.VITE_API_URL || undefined;

const emptyCounts = {
  black: { M: 0, F: 0 },
  yellow: { M: 0, F: 0 },
};

export function useRoster() {
  const [roster, setRoster] = useState([]);
  const [counts, setCounts] = useState(emptyCounts);

  useEffect(() => {
    fetchRoster()
      .then(({ roster: r, counts: c }) => {
        setRoster(r);
        setCounts(c);
      })
      .catch(() => {});

    const socket = io(SOCKET_URL, { path: '/socket.io' });

    socket.on('roster:update', ({ roster: r, counts: c }) => {
      setRoster(r);
      setCounts(c);
    });

    return () => socket.disconnect();
  }, []);

  return { roster, counts };
}
