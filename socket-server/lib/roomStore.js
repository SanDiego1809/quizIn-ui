const { getMode, DEFAULT_MODE_ID } = require("../modes");

/** @type {Map<string, object>} */
const rooms = new Map();

function createEmptyRoom({
  code,
  hostId,
  hostName,
  hostSocketId,
  hostAnimation = "Idle",
  mode = DEFAULT_MODE_ID,
}) {
  const gameMode = getMode(mode);

  return {
    code,
    hostId,
    mode,
    phase: "lobby",
    players: [
      {
        id: hostId,
        name: hostName,
        animation: hostAnimation,
        socketId: hostSocketId,
        isHost: true,
      },
    ],
    settings: { ...gameMode.defaultSettings },
    state: gameMode.createInitialState(),
    phaseDeadline: null,
    phaseTimeoutId: null,
  };
}

function getRoom(code) {
  return rooms.get(code) ?? null;
}

function setRoom(code, room) {
  rooms.set(code, room);
}

function deleteRoom(code) {
  rooms.delete(code);
}

function listRoomCodes() {
  return [...rooms.keys()];
}

module.exports = {
  rooms,
  createEmptyRoom,
  getRoom,
  setRoom,
  deleteRoom,
  listRoomCodes,
};
