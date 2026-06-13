function clearRoomTimer(room) {
  if (room.phaseTimeoutId) {
    clearTimeout(room.phaseTimeoutId);
    room.phaseTimeoutId = null;
  }
}

module.exports = { clearRoomTimer };
