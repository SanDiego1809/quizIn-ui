const {
  uniqueRoomCode,
  randomPlayerId,
  sanitizeName,
  normalizeRoomCode,
} = require("../lib/utils");
const { DEFAULT_MODE_ID, getMode, applyRoomConfig } = require("../modes");
const { createEmptyRoom, setRoom } = require("../lib/roomStore");
const {
  bindSocketToPlayer,
  removeSocketFromAllRooms,
  isHostSocket,
} = require("../lib/roomLifecycle");

function registerRoomHandlers(socket, ctx) {
  const { io, rooms, emitRoom } = ctx;

  socket.on("quiz:room_create", ({ name, mode = DEFAULT_MODE_ID }) => {
    const safeName = sanitizeName(name);
    if (!safeName) {
      socket.emit("quiz:error", { message: "Name is required." });
      return;
    }

    removeSocketFromAllRooms(socket, ctx);

    try {
      getMode(mode);
    } catch {
      socket.emit("quiz:error", { message: "Unknown game mode." });
      return;
    }

    const roomCode = uniqueRoomCode(rooms);
    const playerId = randomPlayerId();
    const room = createEmptyRoom({
      code: roomCode,
      hostId: playerId,
      hostName: safeName,
      hostSocketId: socket.id,
      mode,
    });

    setRoom(roomCode, room);
    socket.join(roomCode);
    bindSocketToPlayer(socket, roomCode, playerId);
    emitRoom(roomCode);
  });

  socket.on("quiz:room_join", ({ roomCode, name }) => {
    const code = normalizeRoomCode(roomCode);
    const safeName = sanitizeName(name);
    const room = rooms.get(code);

    if (!room) {
      socket.emit("quiz:error", { message: "Room not found." });
      return;
    }
    if (room.phase !== "lobby") {
      socket.emit("quiz:error", { message: "This game has already started." });
      return;
    }
    if (!safeName) {
      socket.emit("quiz:error", { message: "Name is required." });
      return;
    }
    if (room.players.some((p) => p.socketId === socket.id)) {
      socket.emit("quiz:error", { message: "You are already in this room." });
      return;
    }

    removeSocketFromAllRooms(socket, ctx);

    const playerId = randomPlayerId();
    room.players.push({
      id: playerId,
      name: safeName,
      socketId: socket.id,
      isHost: false,
    });

    socket.join(code);
    bindSocketToPlayer(socket, code, playerId);
    emitRoom(code);
  });

  socket.on("quiz:room_config", ({ roomCode, mode, settings }) => {
    const code = normalizeRoomCode(roomCode);
    const room = rooms.get(code);

    if (!room) {
      socket.emit("quiz:error", { message: "Room not found." });
      return;
    }
    if (room.phase !== "lobby") {
      socket.emit("quiz:error", {
        message: "Settings can only be changed before the game starts.",
      });
      return;
    }
    if (!isHostSocket(room, socket)) {
      socket.emit("quiz:error", {
        message: "Only the host can change room settings.",
      });
      return;
    }

    if (mode) {
      try {
        getMode(mode);
      } catch {
        socket.emit("quiz:error", { message: "Unknown game mode." });
        return;
      }
    }

    applyRoomConfig(room, { mode, settings });
    emitRoom(code);
  });
}

module.exports = { registerRoomHandlers };
