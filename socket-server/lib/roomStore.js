const { DEFAULT_SETTINGS } = require("../config");

/** @type {Map<string, object>} */
const rooms = new Map();

function createEmptyRoom({ code, hostId, hostName, hostSocketId }) {
  return {
    code,
    hostId,
    phase: "lobby",
    players: [
      {
        id: hostId,
        name: hostName,
        socketId: hostSocketId,
        isHost: true,
      },
    ],
    settings: { ...DEFAULT_SETTINGS },
    questions: [],
    currentQuestionIndex: 0,
    answersByQuestion: [],
    scores: {},
    phaseDeadline: null,
    phaseTimeoutId: null,
    result: null,
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
