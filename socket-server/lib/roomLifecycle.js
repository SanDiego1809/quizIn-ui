const { clearRoomTimer, resetToLobby } = require("./gameLogic");
const { roomPayloadForPlayer } = require("./roomPayload");

function createRoomEmitter(io, rooms) {
  function emitRoom(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;
    for (const player of room.players) {
      io.to(player.socketId).emit(
        "quiz:room_state",
        roomPayloadForPlayer(room, player.id)
      );
    }
  }
  return emitRoom;
}

function getPlayerIdForSocket(room, socket) {
  const code = String(room.code || "").toUpperCase();
  const dataRoom = String(socket.data?.quizRoomCode || "").toUpperCase();
  const dataPid = socket.data?.quizPlayerId;

  if (dataPid && dataRoom === code) {
    const byData = room.players.find(
      (x) => x.id === dataPid && x.socketId === socket.id
    );
    if (byData) return byData.id;
  }

  const player = room.players.find((x) => x.socketId === socket.id);
  return player ? player.id : null;
}

function isHostSocket(room, socket) {
  const host = room.players.find((p) => p.id === room.hostId);
  if (!host) return false;
  if (host.socketId === socket.id) return true;

  if (
    socket.data?.quizPlayerId === room.hostId &&
    String(socket.data?.quizRoomCode || "").toUpperCase() ===
      String(room.code || "").toUpperCase()
  ) {
    host.socketId = socket.id;
    return true;
  }
  return false;
}

function bindSocketToPlayer(socket, roomCode, playerId) {
  socket.data = socket.data || {};
  socket.data.quizPlayerId = playerId;
  socket.data.quizRoomCode = roomCode;
}

function cleanupRoom(rooms, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  if (room.players.length === 0) {
    clearRoomTimer(room);
    rooms.delete(roomCode);
  }
}

function removeSocketFromAllRooms(socket, { rooms, emitRoom, leaveSocketRooms = true }) {
  const socketId = socket.id;

  for (const [roomCode, room] of [...rooms.entries()]) {
    const playerIdx = room.players.findIndex((p) => p.socketId === socketId);
    if (playerIdx === -1) continue;

    if (leaveSocketRooms) {
      socket.leave(roomCode);
    }

    const [removed] = room.players.splice(playerIdx, 1);

    if (removed.id === room.hostId && room.players.length > 0) {
      room.players[0].isHost = true;
      room.hostId = room.players[0].id;
    }

    if (room.phase !== "lobby" && room.players.length === 0) {
      clearRoomTimer(room);
      rooms.delete(roomCode);
      continue;
    }

    emitRoom(roomCode);
    cleanupRoom(rooms, roomCode);
  }
}

module.exports = {
  createRoomEmitter,
  getPlayerIdForSocket,
  isHostSocket,
  bindSocketToPlayer,
  cleanupRoom,
  removeSocketFromAllRooms,
  resetToLobby,
};
