const http = require("http");
const { Server } = require("socket.io");
const { PORT, HOST, SOCKET_IDLE_MS, CORS_ORIGINS } = require("./config");
const { rooms } = require("./lib/roomStore");
const {
  createRoomEmitter,
  removeSocketFromAllRooms,
} = require("./lib/roomLifecycle");
const {
  advanceQuestion,
  scheduleQuestionTimer,
} = require("./lib/gameLogic");
const { registerSocketHandlers } = require("./handlers");

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "quizin-socket" }));
    return;
  }
  res.writeHead(404);
  res.end();
});
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ["GET", "POST"],
  },
});

const emitRoom = createRoomEmitter(io, rooms);

const ctx = {
  io,
  rooms,
  emitRoom,
  removeSocketFromAllRooms: (socket, options) =>
    removeSocketFromAllRooms(socket, { io, rooms, emitRoom, ...options }),
  advanceQuestion: (roomCode) =>
    advanceQuestion(roomCode, { rooms, scheduleQuestionTimer: bindSchedule, emitRoom }),
  scheduleQuestionTimer: bindSchedule,
};

function bindSchedule(roomCode) {
  scheduleQuestionTimer(roomCode, {
    rooms,
    advanceQuestion: ctx.advanceQuestion,
    emitRoom,
  });
}

registerSocketHandlers(io, ctx);

if (SOCKET_IDLE_MS > 0) {
  const sweepMs = Math.min(60_000, Math.max(15_000, SOCKET_IDLE_MS / 6));
  setInterval(() => {
    const now = Date.now();
    for (const socket of io.sockets.sockets.values()) {
      const last = socket.data?.lastActivityAt ?? 0;
      if (now - last <= SOCKET_IDLE_MS) continue;
      try {
        socket.emit("quiz:error", {
          message: "Disconnected due to inactivity. Rejoin the room to play again.",
        });
      } catch {
        /* ignore */
      }
      socket.disconnect(true);
    }
  }, sweepMs);
}

server.listen(PORT, HOST, () => {
  console.log(`QuizIn socket server listening on http://${HOST}:${PORT}`);
  if (SOCKET_IDLE_MS > 0) {
    console.log(`Idle disconnect after ${SOCKET_IDLE_MS}ms (QUIZIN_SOCKET_IDLE_MS=0 to disable)`);
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other process or run with QUIZIN_SOCKET_PORT=4001`
    );
    console.error("Windows: netstat -ano | findstr :4000  then  taskkill /PID <pid> /F");
    process.exit(1);
  }
  throw err;
});
