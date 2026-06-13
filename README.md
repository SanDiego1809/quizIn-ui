# QuizIn UI

Node + React app built with [Next.js](https://nextjs.org/) 16 and React 19.

Multiplayer quiz game: create a room, invite friends with a 6-letter code, then answer **4 questions** together. The server picks random questions from a built-in bank and tracks scores in real time via Socket.IO.

## Requirements

- Node.js 22+

## Getting started

Install dependencies, then run **two** processes (UI + socket server):

```bash
npm install

# Terminal 1 — Next.js app
npm run dev

# Terminal 2 — real-time game server (port 4000)
npm run dev:socket
```

Open [http://localhost:3000](http://localhost:3000) and click **Start a quiz**, or go directly to [http://localhost:3000/play](http://localhost:3000/play).

## Environment

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `NEXT_PUBLIC_SOCKET_URL` | *(same as the page)* | Override only if the socket server is on another host |
| `QUIZIN_SOCKET_URL` | `http://127.0.0.1:4000` | Backend URL used by Next.js to proxy `/socket.io` |
| `QUIZIN_SOCKET_PORT` | `4000` | Socket server listen port |
| `NEXT_PUBLIC_APP_ORIGIN` | `http://localhost:3000,…` | Extra allowed CORS origins for direct socket connections |
| `QUIZIN_SOCKET_IDLE_MS` | `1800000` | Disconnect idle clients (`0` to disable) |

In **development**, the browser connects directly to `http://127.0.0.1:4000` (CORS allows localhost origins). In **production**, it uses the same origin and Next.js rewrites `/socket.io` to the socket server.

You still need **`npm run dev:socket`** running in a second terminal.

If you see a connection error, restart **both** terminals after pulling changes (`npm run dev` and `npm run dev:socket`).

## Project layout

```
socket-server/              Real-time game server
  server.js                 Entry point
  config.js                 Ports, CORS
  data/questions.json       Question bank (shared across modes)
  modes/                    Game mode plugins (rules + payloads)
    index.js                Mode registry
    classic/                Classic quiz mode
  lib/                      Room store, timers, lifecycle
  handlers/                 Socket event handlers (thin dispatchers)

app/play/                   Multiplayer quiz UI
components/quiz/
  modes/                    Mode-specific UI (ModeView + per-mode views)
hooks/useQuizRoom.js        Client socket state
lib/quiz/
  socket.js                 Socket.IO client singleton
  modes/                    Client mode view registry
```

## Game modes

The app uses a **mode plugin** architecture so each game type can have its own rules, state shape, and UI without tangling everything in one file.

### How it works

**Server** — each mode is a module in `socket-server/modes/` that exports:

| Method | Purpose |
| ------ | ------- |
| `id`, `label` | Mode identifier and display name |
| `defaultSettings` | Default settings for new rooms |
| `settingsFields` | Lobby form metadata (labels, min, max, hints) |
| `sanitizeSettings(input)` | Validate/normalize settings from the client |
| `createInitialState()` | Mode-private state when a room is created |
| `start(room, ctx)` | Begin a game |
| `handleAction(room, action, ctx)` | Handle player actions (`submit_answer`, etc.) |
| `reset(room)` | Return room to lobby |
| `buildPayload(room, playerId)` | Build mode-specific fields for `quiz:room_state` |

**Room shape** on the server:

- **Shared shell** — `code`, `mode`, `phase`, `players`, `settings`, timers
- **Mode state** — `room.state` holds mode-private data (questions, scores, etc.)

**Handlers** stay thin: they validate auth (host, in room, phase) then call `getMode(room.mode).start()` / `handleAction()` / `reset()`.

**Client** — `components/quiz/modes/ModeView.jsx` picks a view component from `lib/quiz/modes/` based on `room.mode`. Shared pieces (lobby, room code, player list) can be reused across modes.

### Socket events

| Event | Description |
| ----- | ----------- |
| `quiz:room_create` | Create room (`{ name, mode? }` — `mode` defaults to `"classic"`) |
| `quiz:room_join` | Join room with code and name |
| `quiz:room_config` | Host updates mode/settings in lobby (`{ roomCode, mode?, settings? }`) |
| `quiz:game_start` | Host starts game (`{ roomCode }` — uses current room settings) |
| `quiz:game_action` | Generic player action (`{ roomCode, action: { type, … } }`) |
| `quiz:answer_submit` | Shortcut for classic mode (`{ roomCode, optionIndex }`) |
| `quiz:game_reset` | Host resets room to lobby |
| `quiz:room_state` | Server pushes full room state to each player |

### Adding a new mode

1. **Server logic** — create `socket-server/modes/yourmode/`:
   - `logic.js` — rules, scoring, phase transitions
   - `payload.js` — what the client needs to render
   - `index.js` — export the mode object (see `classic/index.js`)

2. **Register on server** — add to `socket-server/modes/index.js`:

   ```js
   const yourmode = require("./yourmode");
   const MODES = { classic, yourmode };
   ```

3. **Client UI** — create `components/quiz/modes/yourmode/YourModeView.jsx` and register it in `lib/quiz/modes/index.js`.

4. **Create rooms** — pass `mode: "yourmode"` when emitting `quiz:room_create`, or add a mode picker to the lobby.

5. **Actions** — use `quiz:game_action` with mode-specific `action.type` values handled in your mode's `handleAction()`.

Each mode can also export `settingsFields` (labels, min/max) so the waiting room can render a settings form for the host. Non-hosts see a read-only summary. Changes are synced with `quiz:room_config` before the host clicks **Start**.

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start Next.js development server |
| `npm run dev:socket` | Start the quiz Socket.IO server |
| `npm run build` | Build for production |
| `npm run start` | Start production Next.js server |
| `npm run lint` | Run ESLint |

## How a game works (classic mode)

1. **Create or join** a room with your name.
2. The **host** starts the quiz when everyone is ready.
3. All players get the **same 4 questions**, one at a time.
4. Pick an answer before the timer runs out (30s default).
5. When everyone has answered (or time is up), the next question appears.
6. After question 4, see the **leaderboard** and answer key.
