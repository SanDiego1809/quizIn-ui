const { randomUUID } = require("crypto");

function randomRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function uniqueRoomCode(rooms) {
  let code = randomRoomCode();
  while (rooms.has(code)) code = randomRoomCode();
  return code;
}

function randomPlayerId() {
  return `p_${randomUUID()}`;
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function sanitizeName(name) {
  return String(name || "").trim().slice(0, 30);
}

function normalizeRoomCode(roomCode) {
  return String(roomCode || "").trim().toUpperCase();
}

function touchSocketActivity(socket) {
  if (!socket.data) socket.data = {};
  socket.data.lastActivityAt = Date.now();
}

module.exports = {
  randomRoomCode,
  uniqueRoomCode,
  randomPlayerId,
  shuffle,
  sanitizeName,
  normalizeRoomCode,
  touchSocketActivity,
};
