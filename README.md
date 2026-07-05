# Smash Bash

Landing page + iscrizione torneo beach volley con sorteggio squadre e roster in tempo reale.

## Stack

- **Client:** React (Vite)
- **Server:** Node.js, Express, Socket.io
- **DB:** SQLite (`server/data/smashbash.db`)

## Modello Player

| Campo      | Tipo   | Note                          |
|------------|--------|-------------------------------|
| id         | int    | PK auto                       |
| nome       | string |                               |
| cognome    | string | unique con nome (case-insens.)|
| sesso      | M / F  |                               |
| team       | string | `black` / `yellow`, null fino al sorteggio |
| drawn_at   | int    | timestamp ms                  |
| created_at | int    | timestamp ms                  |

## Avvio in sviluppo

```bash
# dalla root del progetto
npm run install:all

# terminale 1 — API + WebSocket (porta 3001)
npm run dev:server

# terminale 2 — React (porta 5173)
npm run dev:client
```

Apri http://localhost:5173 — il proxy Vite inoltra `/api` e `/socket.io` al backend.

## API

| Metodo | Path                    | Descrizione              |
|--------|-------------------------|--------------------------|
| GET    | `/api/roster`           | Roster + conteggi posti  |
| POST   | `/api/players`          | Iscrizione (senza team)  |
| POST   | `/api/players/:id/draw` | Sorteggio + assegnazione |

Evento WebSocket `roster:update` inviato a tutti i client dopo ogni sorteggio.

## Produzione

### Architettura consigliata

| Parte | Dove | Perché |
|-------|------|--------|
| **Frontend** (React) | [Vercel](https://vercel.com) | CDN, deploy automatico |
| **Backend** (API + WebSocket + SQLite) | [Render](https://render.com) | Server Node persistente, Socket.io, file SQLite |

Vercel non supporta bene Express + Socket.io + SQLite sullo stesso deploy.

### 1 — Backend su Render

1. Crea un repo GitHub con questo progetto (o solo la cartella `server/` + `render.yaml` alla root).
2. Su Render: **New → Blueprint** (oppure Web Service) e collega il repo.
3. Imposta la variabile d'ambiente:
   - `CLIENT_ORIGIN` = URL Vercel del frontend (es. `https://smash-bash.vercel.app`)
4. Annota l'URL del servizio (es. `https://smash-bash-api.onrender.com`).

> **Nota:** sul piano free di Render il filesystem è effimero: i dati SQLite possono resetsarsi ai redeploy. Per un evento singolo va bene; per produzione stabile valuta un volume persistente o un DB esterno.

### 2 — Frontend su Vercel

1. Importa il repo su Vercel (o `npx vercel` dalla cartella `client/`).
2. Impostazioni progetto:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Variabile d'ambiente (obbligatoria in produzione):
   - `VITE_API_URL` = URL Render del backend (senza slash finale)
4. Deploy.

### 3 — Verifica

- Apri il sito Vercel → iscrizione e sorteggio devono funzionare.
- Il roster si aggiorna in tempo reale via WebSocket.
- `GET https://TUO-BACKEND/api/health` → `{ "ok": true }`

### Deploy monolitico (alternativa)

Se preferisci un solo host (senza Vercel):

```bash
npm run build
NODE_ENV=production npm run start
```

Un solo processo serve API, WebSocket e la build React su http://localhost:3001.

## Variabili d'ambiente (server)

| Variabile       | Default                  |
|-----------------|--------------------------|
| `PORT`          | `3001`                   |
| `CLIENT_ORIGIN` | `http://localhost:5173`  |
| `DB_PATH`       | `server/data/smashbash.db` |
