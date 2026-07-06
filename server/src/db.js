import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.join(__dirname, '..', 'data');
const dbPath = process.env.DB_PATH || path.join(dataDir, 'smashbash.db');

fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    sesso TEXT NOT NULL CHECK (sesso IN ('M', 'F')),
    taglia TEXT NOT NULL,
    telefono TEXT NOT NULL DEFAULT '',
    team TEXT CHECK (team IN ('black', 'yellow')),
    drawn_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    UNIQUE (nome COLLATE NOCASE, cognome COLLATE NOCASE)
  )
`);

const playerColumns = db.prepare('PRAGMA table_info(players)').all();
if (!playerColumns.some((col) => col.name === 'telefono')) {
  db.exec(`ALTER TABLE players ADD COLUMN telefono TEXT NOT NULL DEFAULT ''`);
}

export const CAP = 6;
