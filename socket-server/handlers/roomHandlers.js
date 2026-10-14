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
  getPlayerIdForSocket,
} = require("../lib/roomLifecycle");
const {
  sanitizeVictoryAnimationChoice,
  sanitizeSkinChoice,
  DEFAULT_SKIN,
} = require("../lib/cosmetics");
const { DEFAULT_ANIMATION } = require("../lib/animations");
const { canAcceptPlayer, buildSeatInfo } = require("../lib/premiumSeats");
const { hydrateSocketAccess, socketAccess } = require("../lib/playerAccess");

async function ensureSocketAccess(socket) {
  if (socket.data?.accessHydrated) return socketAccess(socket);
  await hydrateSocketAccess(socket);
  socket.data.accessHydrated = true;
  return socketAccess(socket);
}

function cosmeticsFromAccess(access) {
  if (!access.signedIn) {
    return {
      animation: DEFAULT_ANIMATION,
      victoryAnimation: DEFAULT_ANIMATION,
      skinKey: DEFAULT_SKIN,
    };
  }
  return {
    animation: DEFAULT_ANIMATION,
    victoryAnimation: sanitizeVictoryAnimationChoice(
      access.victoryAnimation,
      access
    ),
    skinKey: sanitizeSkinChoice(access.skinKey, access),
  };
}

function registerRoomHandlers(socket, ctx) {
  const { rooms, emitRoom } = ctx;

  socket.on("quiz:room_create", async ({ name, mode = DEFAULT_MODE_ID }) => {
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

    const access = await ensureSocketAccess(socket);
    const cosmetics = cosmeticsFromAccess(access);
    const roomCode = uniqueRoomCode(rooms);
    const playerId = randomPlayerId();
    const room = createEmptyRoom({
      code: roomCode,
      hostId: playerId,
      hostName: safeName,
      hostSocketId: socket.id,
      hostAnimation: cosmetics.animation,
      mode,
    });
    room.players[0].userId = socket.data?.userId || null;
    room.players[0].plan = access.plan;
    room.players[0].unlockedCosmetics = access.unlockedCosmetics;
    room.players[0].skinKey = cosmetics.skinKey;
    room.players[0].victoryAnimation = cosmetics.victoryAnimation;
    room.settings = getMode(mode).sanitizeSettings(room.settings, {
      premium: access.plan === "premium",
    });

    setRoom(roomCode, room);
    socket.join(roomCode);
    bindSocketToPlayer(socket, roomCode, playerId);
    emitRoom(roomCode);
  });

  socket.on("quiz:room_join", async ({ roomCode, name }) => {
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

    const access = await ensureSocketAccess(socket);
    if (!canAcceptPlayer(room.players, access.plan)) {
      const seats = buildSeatInfo(room.players);
      socket.emit("quiz:error", {
        message:
          seats.count >= seats.hardCap
            ? "This room is full (8 players max)."
            : "Need another Premium player for a larger room. Upgrade on your profile — each Premium unlocks +1 seat (free rooms hold 4).",
        code: "ROOM_SEAT_LIMIT",
      });
      return;
    }

    removeSocketFromAllRooms(socket, ctx);

    const cosmetics = cosmeticsFromAccess(access);
    const playerId = randomPlayerId();
    room.players.push({
      id: playerId,
      name: safeName,
      animation: cosmetics.animation,
      victoryAnimation: cosmetics.victoryAnimation,
      skinKey: cosmetics.skinKey,
      socketId: socket.id,
      isHost: false,
      userId: socket.data?.userId || null,
      plan: access.plan,
      unlockedCosmetics: access.unlockedCosmetics,
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

  // Kept for compatibility; in-game animation picking is disabled (Idle only).
  socket.on("quiz:player_animation", async ({ roomCode }) => {
    const code = normalizeRoomCode(roomCode);
    const room = rooms.get(code);
    if (!room) return;

    const playerId = getPlayerIdForSocket(room, socket);
    if (!playerId) return;

    const player = room.players.find((entry) => entry.id === playerId);
    if (!player) return;

    player.animation = DEFAULT_ANIMATION;
    emitRoom(code);
  });
}

module.exports = { registerRoomHandlers };
