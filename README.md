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
| telefono   | string | non esposto nel roster pubblico |
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

### Docker sul Raspberry Pi (consigliato)

Un solo container serve **frontend + API + WebSocket + SQLite**. I dati restano nel volume Docker `smashbash-data`.

#### 1 — Prepara il Raspberry

```bash
# sul Pi
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER
# esci e rientra nella sessione SSH
```

#### 2 — Clona e configura

```bash
git clone <tuo-repo> smash-bash
cd smash-bash
cp .env.example .env
```

Modifica `.env`:

```env
APP_PORT=3001
CLIENT_ORIGIN=https://smashbash.tuodominio.it
DOMAIN=smashbash.tuodominio.it
```

> `CLIENT_ORIGIN` deve coincidere con l'URL che gli utenti aprono nel browser (http o https).

#### 3 — Build e avvio

```bash
docker compose build
docker compose up -d
docker compose logs -f smash-bash
```

Sito disponibile su `http://IP-DEL-PI:3001` (o sul dominio, vedi sotto).

#### 4 — Dominio e HTTPS

**Opzione A — Caddy integrato** (Let's Encrypt automatico):

```bash
docker compose --profile tls up -d
```

Assicurati che il DNS del dominio punti all'IP pubblico del Pi e che le porte 80/443 siano aperte sul router.

**Opzione B — Nginx / reverse proxy già presente sul Pi**

Inoltra tutto verso `http://127.0.0.1:3001`, includendo gli header WebSocket per Socket.io:

```nginx
server {
    listen 443 ssl;
    server_name smashbash.tuodominio.it;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### 5 — Verifica

- Apri il sito → iscrizione e sorteggio
- Roster live via WebSocket
- `curl http://localhost:3001/api/health` → `{"ok":true}`

#### Comandi utili

```bash
npm run docker:build    # rebuild immagine
npm run docker:up       # avvia in background
npm run docker:logs     # log live
npm run docker:down     # ferma i container
```

> **Nota Pi:** builda l'immagine **sul Raspberry** (ARM). Se buildi da PC Windows, usa `docker compose build` direttamente sul Pi dopo il clone, non cross-compile.

---

### Deploy locale senza Docker

```bash
npm run build
NODE_ENV=production CLIENT_ORIGIN=http://localhost:3001 npm run start
```

Un solo processo serve API, WebSocket e la build React su http://localhost:3001.

---

### Cloud (alternativa)

Per deploy su Vercel + Render vedi `client/vercel.json` e `render.yaml`.

## Variabili d'ambiente (server)

| Variabile       | Default                  |
|-----------------|--------------------------|
| `PORT`          | `3001`                   |
| `CLIENT_ORIGIN` | `http://localhost:5173`  |
| `DB_PATH`       | `server/data/smashbash.db` |
