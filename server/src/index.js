import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  registerPlayer,
  drawTeam,
  getRosterPayload,
} from './playerService.js';
import {
  getTournamentState,
  drawPairs,
  drawGironi,
  drawMatches,
  drawPairsFase2,
  drawGironiFase2,
  drawMatchesFase2,
  resetFase1,
  resetFase2,
  resetFinale,
  updateMatchResult,
  drawFinalePairs,
  drawFinaleSemifinals,
  drawFinaleTiebreak,
  startIquitPairs,
  startIquitMatches,
  startIquitPairsBatch2,
  startIquitMatchesBatch2,
  updateIquitResult,
  resetIquitChamp,
} from './tournamentService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const TRUST_TAILSCALE =
  process.env.TRUST_TAILSCALE === '1' ||
  CLIENT_ORIGINS.some((origin) => origin.includes('.ts.net'));

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (CLIENT_ORIGINS.includes(origin)) return true;
  if (
    TRUST_TAILSCALE &&
    /^https:\/\/[a-z0-9.-]+\.ts\.net$/i.test(origin)
  ) {
    return true;
  }
  return false;
}

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');

const app = express();
const httpServer = createServer(app);

const corsOptions = {
  origin(origin, callback) {
    callback(null, isAllowedOrigin(origin));
  },
  methods: ['GET', 'POST', 'PATCH'],
};

const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
    methods: ['GET', 'POST', 'PATCH'],
  },
});

app.use(cors(corsOptions));
app.use(express.json());

function broadcastRoster() {
  io.emit('roster:update', getRosterPayload());
}

function broadcastTournament() {
  io.emit('tournament:update', getTournamentState());
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/roster', (_req, res) => {
  res.json(getRosterPayload());
});

app.get('/api/tournament', (_req, res) => {
  res.json(getTournamentState());
});

app.get('/api/tournament/fase-1', (_req, res) => {
  res.json(getTournamentState().fase1);
});

app.post('/api/tournament/fase-1/draw-pairs', (_req, res) => {
  const result = drawPairs();
  if (result.error) return res.status(result.status).json({ error: result.error });
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/fase-1/draw-gironi', (_req, res) => {
  const result = drawGironi();
  if (result.error) return res.status(result.status).json({ error: result.error });
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/fase-1/draw-matches', (_req, res) => {
  const result = drawMatches();
  if (result.error) return res.status(result.status).json({ error: result.error });
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/fase-1/reset', (_req, res) => {
  const result = resetFase1();
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/fase-2/draw-pairs', (_req, res) => {
  const result = drawPairsFase2();
  if (result.error) return res.status(result.status).json({ error: result.error });
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/fase-2/draw-gironi', (_req, res) => {
  const result = drawGironiFase2();
  if (result.error) return res.status(result.status).json({ error: result.error });
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/fase-2/draw-matches', (_req, res) => {
  const result = drawMatchesFase2();
  if (result.error) return res.status(result.status).json({ error: result.error });
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/fase-2/reset', (_req, res) => {
  const result = resetFase2();
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/finale/draw-pairs', (_req, res) => {
  const result = drawFinalePairs();
  if (result.error) return res.status(result.status).json({ error: result.error });
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/finale/draw-semifinals', (_req, res) => {
  const result = drawFinaleSemifinals();
  if (result.error) return res.status(result.status).json({ error: result.error });
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/finale/draw-tiebreak', (_req, res) => {
  const result = drawFinaleTiebreak();
  if (result.error) return res.status(result.status).json({ error: result.error });
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/finale/reset', (_req, res) => {
  const result = resetFinale();
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/iquit/draw-pairs', (_req, res) => {
  const result = startIquitPairs();
  if (result.error) return res.status(result.status).json({ error: result.error });
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/iquit/draw-matches', (_req, res) => {
  const result = startIquitMatches();
  if (result.error) return res.status(result.status).json({ error: result.error });
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/iquit/draw-pairs-batch2', (_req, res) => {
  const result = startIquitPairsBatch2();
  if (result.error) return res.status(result.status).json({ error: result.error });
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/iquit/draw-matches-batch2', (_req, res) => {
  const result = startIquitMatchesBatch2();
  if (result.error) return res.status(result.status).json({ error: result.error });
  broadcastTournament();
  res.json(result.state);
});

app.post('/api/tournament/iquit/reset', (_req, res) => {
  const result = resetIquitChamp();
  broadcastTournament();
  res.json(result.state);
});

app.patch('/api/tournament/iquit/matches/:id/result', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID non valido.' });
  }

  const result = updateIquitResult(id, {
    blackScore: req.body?.blackScore,
    yellowScore: req.body?.yellowScore,
  });

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  broadcastTournament();
  res.json(result.state);
});

app.patch('/api/tournament/matches/:id/result', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID non valido.' });
  }

  const result = updateMatchResult(id, {
    blackScore: req.body?.blackScore,
    yellowScore: req.body?.yellowScore,
  });

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  broadcastTournament();
  res.json(result.state);
});

app.post('/api/players', (req, res) => {
  const result = registerPlayer(req.body);
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }
  res.status(201).json(result);
});

app.post('/api/players/:id/draw', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID non valido.' });
  }

  const result = drawTeam(id);
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  broadcastRoster();
  res.json(result);
});

io.on('connection', (socket) => {
  socket.emit('roster:update', getRosterPayload());
  socket.emit('tournament:update', getTournamentState());
});

if (process.env.NODE_ENV === 'production') {
  const indexHtml = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(indexHtml);
    });
  }
}

httpServer.listen(PORT, () => {
  console.log(`Smash Bash API → http://localhost:${PORT}`);
});
