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
  methods: ['GET', 'POST'],
};

const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
    methods: ['GET', 'POST'],
  },
});

app.use(cors(corsOptions));
app.use(express.json());

function broadcastRoster() {
  io.emit('roster:update', getRosterPayload());
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/roster', (_req, res) => {
  res.json(getRosterPayload());
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
