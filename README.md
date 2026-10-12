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
| `NEXT_PUBLIC_SOCKET_URL` | *(dev: `127.0.0.1:4000`)* | Browser Socket.IO URL. On Vercel set this to your long-running socket host |
| `QUIZIN_SOCKET_URL` | `http://127.0.0.1:4000` | Backend URL used by Next.js to proxy `/socket.io` |
| `QUIZIN_SOCKET_PORT` | `4000` | Socket listen port (Render uses `PORT` first) |
| `NEXT_PUBLIC_APP_ORIGIN` | `http://localhost:3000,…` | Extra allowed CORS origins for direct socket connections |
| `QUIZIN_SOCKET_IDLE_MS` | `1800000` | Disconnect idle clients (`0` to disable) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` (dev) | Canonical site URL for sitemap, Open Graph, and JSON-LD (no trailing slash) |
| `GOOGLE_SITE_VERIFICATION` | *(unset)* | Google Search Console HTML tag verification token |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | *(unset)* | Clerk publishable key (auth UI). Guests still work without it |
| `CLERK_SECRET_KEY` | *(unset)* | Clerk secret (Next.js + socket JWT verify) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Clerk sign-in path |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Clerk sign-up path |
| `DATABASE_URL` | *(unset)* | Neon Postgres connection string (profiles, history, favorites, credits) |

Copy [`.env.example`](.env.example) to `.env.local` for Next.js. The socket server loads `.env` / `.env.local` via `socket-server/loadEnv.js`, so the same `CLERK_SECRET_KEY` and `DATABASE_URL` are available to both processes locally.

## Auth, profiles & database

QuizIn supports **guest play** and optional **accounts**. Passwords are never stored in this repo — [Clerk](https://clerk.com) handles sign-in (email + OAuth). App data (profiles, history, favorites, credits) lives in **Postgres** (recommended: [Neon](https://neon.tech)) via **Prisma**.

### What guests vs signed-in users can do

| | Guest | Signed in |
| --- | --- | --- |
| Create / join / play rooms | Yes | Yes |
| Persistent display name & avatar | No (entered each time) | Yes (`/profile`) |
| Game history & credits | No | Yes (saved when a match ends) |
| Favorites (e.g. quiz modes) | Sign-in required | Yes (free: 3 max; premium: unlimited) |
| Premium unlocks | — | `UserProfile.plan = premium` (set in DB for now) |

### How it fits together

1. **Next.js (Vercel)** — `ClerkProvider`, sign-in/up UI, `/profile`, and `/api/me*` routes.
2. **Clerk** — issues session tokens; middleware protects `/profile` and `/api/me*`. `/play` stays public.
3. **Socket.IO** — optional JWT on connect (`socket.auth.token`). If valid, the player gets a `userId`; guests omit the token and play as today.
4. **Neon + Prisma** — schema in [`prisma/schema.prisma`](prisma/schema.prisma): `UserProfile`, `GameResult`, `Favorite`.

On first API call after sign-in, the app **upserts** a `UserProfile` from the Clerk user id. The lobby prefills name/avatar from that profile when signed in.

### Clerk app settings (dashboard)

Create a **Consumer** application (not B2B). Recommended sign-in options:

- Email (password or email code)
- Google OAuth

Set paths to `/sign-in` and `/sign-up`, and allow `http://localhost:3000` plus your Vercel URL.

You can also link the project with the [Clerk CLI](https://clerk.com/docs/cli): `clerk auth login` then `clerk init` (keys are written to `.env.local`).

### Local database setup

```bash
# After DATABASE_URL is set in .env.local (Neon `neon link` / `neon deploy` can write it)
npm run db:push      # create/sync tables
npm run db:studio    # optional Prisma Studio UI
```

`npm run db:push` loads `.env.local` (Prisma alone only auto-loads `.env`).

`npm run build` / `postinstall` run `prisma generate` so the client stays in sync.

### Deploy (Vercel + Render)

Split hosting: **Vercel** for Next.js; **Render** for the Socket.IO process ([`render.yaml`](render.yaml)). Do **not** run rooms on Vercel serverless — they will not survive across invocations.

#### 1. Vercel (Next.js)

Production app: **https://quizin-ui.vercel.app** (project `quizin-ui` under the Vercel team).

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new) (framework: Next.js), or deploy with `npx vercel --prod` after `npx vercel login`.
2. Add environment variables (Production + Preview as needed):

| Variable | Notes |
| -------- | ----- |
| `NEXT_PUBLIC_SITE_URL` | Final app URL, e.g. `https://quizin-ui.vercel.app` |
| `NEXT_PUBLIC_SOCKET_URL` | Render socket URL (set after step 2), e.g. `https://quizin-socket.onrender.com` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | From Clerk dashboard |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-in`, `/sign-up` |
| `DATABASE_URL` | Neon connection string |
| `GOOGLE_SITE_VERIFICATION` / `NEXT_PUBLIC_GA_ID` | Optional |

3. Deploy. Note the deployment URL for CORS on Render.
4. In Clerk, allow that Vercel URL (and custom domain if any) as an authorized origin / redirect URL.

CLI (after `npx vercel login`): `npx vercel` then `npx vercel --prod`; set secrets with `npx vercel env add`.

#### 2. Render (socket server)

Production socket: **https://quizin-socket.onrender.com** (health: `/health`).

Render needs a GitHub repo it can fetch. If the org repo is private and not linked in Render, use a personal mirror (e.g. [SanDiego1809/quizIn-ui](https://github.com/SanDiego1809/quizIn-ui)) or connect the org in the Render Dashboard → Account → GitHub.

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** (uses [`render.yaml`](render.yaml)), **or** **Web Service** manually:
   - **Build:** `npm install`
   - **Start:** `npm run start:socket`
   - **Health check:** `/health`
2. Set env vars on the service:

| Variable | Notes |
| -------- | ----- |
| `NODE_ENV` | `production` (Blueprint already sets this) |
| `NEXT_PUBLIC_APP_ORIGIN` | Vercel URL(s), comma-separated — e.g. `https://quizin-ui.vercel.app` |
| `DATABASE_URL` | Same Neon string as Vercel |
| `CLERK_SECRET_KEY` | Same as Vercel (socket JWT verify) |

Render injects `PORT`; the socket server listens on `PORT` or `QUIZIN_SOCKET_PORT` (default `4000`).

#### 3. Cross-link the two hosts

1. Copy the Render service URL → Vercel env `NEXT_PUBLIC_SOCKET_URL` → redeploy Vercel.
2. Confirm Render `NEXT_PUBLIC_APP_ORIGIN` includes every browser origin that loads the app (Vercel URL + custom domain).
3. Smoke-test: open the Vercel URL → Start a quiz → room create/join over WebSocket.

In **development**, the browser connects to `http://127.0.0.1:4000`. In **production**, the browser uses `NEXT_PUBLIC_SOCKET_URL` (same-origin `/socket.io` rewrites alone are not enough across hosts).

## SEO & Google Search Console

Marketing routes are indexable: `/`, `/play`, `/contact`, `/multiplayer-quiz`, `/classic-quiz`, `/geography-quiz`. The app exposes:

- **`/sitemap.xml`** — generated from `app/sitemap.js`
- **`/robots.txt`** — allows crawlers and points to the sitemap
- **Metadata** — titles, descriptions, Open Graph, and Twitter cards via `lib/site/metadata.js`
- **JSON-LD** — structured data on the home and contact pages

After deploy:

1. Set **`NEXT_PUBLIC_SITE_URL`** to your production URL (e.g. `https://quizin.example.com`).
2. Open [Google Search Console](https://search.google.com/search-console), add your property, and choose the **HTML tag** verification method.
3. Copy the `content` value from the meta tag and set **`GOOGLE_SITE_VERIFICATION`** in your hosting environment, then redeploy.
4. In Search Console, submit **`https://your-domain/sitemap.xml`**.

Landing pages link to `/play` (and `/play?mode=classic` or `geography`) so campaign URLs pre-select a game mode when creating a room.

You still need **`npm run dev:socket`** running in a second terminal.

If you see a connection error, restart **both** terminals after pulling changes (`npm run dev` and `npm run dev:socket`).

## Project layout

```
prisma/                     Postgres schema (UserProfile, GameResult, Favorite)
app/
  play/                     Multiplayer quiz UI
  profile/                  Account profile, history, favorites
  sign-in/, sign-up/        Clerk hosted auth pages
  api/me/                   Profile / history / favorites APIs
socket-server/              Real-time game server
  server.js                 Entry point (+ Clerk JWT middleware)
  lib/clerkAuth.js          Optional session verify on connect
  lib/persistGameResults.js Write history/credits for signed-in players
  lib/db.js                 Prisma client for the socket process
  modes/                    Game mode plugins (rules + payloads)
components/auth/            Header sign-in/up, session helpers
hooks/useQuizRoom.js        Client socket state (+ Clerk token sync)
hooks/usePlayerProfile.js   Prefill lobby from /api/me
lib/quiz/socket.js          Socket.IO client singleton
lib/db/                     Prisma helpers for Next.js API routes
middleware.js               Clerk middleware (protects /profile, /api/me*)
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
| `npm run build` | `prisma generate` + production Next.js build |
| `npm run start` | Start production Next.js server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Prisma schema to Postgres (Neon) |
| `npm run db:studio` | Open Prisma Studio |

## How a game works (classic mode)

1. **Create or join** a room with your name.
2. The **host** starts the quiz when everyone is ready.
3. All players get the **same 4 questions**, one at a time.
4. Pick an answer before the timer runs out (30s default).
5. When everyone has answered (or time is up), the next question appears.
6. After question 4, see the **leaderboard** and answer key.
