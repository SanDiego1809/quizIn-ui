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

The browser connects through **Next.js** at `/socket.io` (same origin as the app), which avoids CORS and `xhr poll error` issues. You still need **`npm run dev:socket`** running in a second terminal.

If you see a connection error, restart **both** terminals after pulling changes (`npm run dev` and `npm run dev:socket`).

## Project layout

```
socket-server/          Real-time game server (split into small modules)
  server.js             Entry point
  config.js             Ports, CORS, default settings
  data/questions.json   Question bank
  lib/                  Room store, game logic, payloads
  handlers/             Socket event handlers

app/play/               Multiplayer quiz UI
components/quiz/        Lobby, question, and results views
hooks/useQuizRoom.js    Client socket state
lib/quiz/socket.js      Socket.IO client singleton
```

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start Next.js development server |
| `npm run dev:socket` | Start the quiz Socket.IO server |
| `npm run build` | Build for production |
| `npm run start` | Start production Next.js server |
| `npm run lint` | Run ESLint |

## How a game works

1. **Create or join** a room with your name.
2. The **host** starts the quiz when everyone is ready.
3. All players get the **same 4 questions**, one at a time.
4. Pick an answer before the timer runs out (30s default).
5. When everyone has answered (or time is up), the next question appears.
6. After question 4, see the **leaderboard** and answer key.
