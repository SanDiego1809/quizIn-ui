const classic = require("./classic");

const MODES = {
  [classic.id]: classic,
};

const DEFAULT_MODE_ID = classic.id;

function getMode(modeId) {
  const mode = MODES[modeId];
  if (!mode) {
    throw new Error(`Unknown game mode: ${modeId}`);
  }
  return mode;
}

function listModes() {
  return Object.values(MODES).map(
    ({ id, label, description, defaultSettings, settingsFields }) => ({
      id,
      label,
      description,
      defaultSettings,
      settingsFields,
    })
  );
}

function applyRoomConfig(room, { mode: modeId, settings } = {}) {
  const targetModeId = modeId ?? room.mode;
  const mode = getMode(targetModeId);

  if (modeId && modeId !== room.mode) {
    room.mode = modeId;
    room.state = mode.createInitialState();
    room.settings = mode.sanitizeSettings({
      ...mode.defaultSettings,
      ...settings,
    });
    return;
  }

  if (settings) {
    room.settings = mode.sanitizeSettings({
      ...room.settings,
      ...settings,
    });
  }
}

function buildRoomPayload(room, playerId) {
  const mode = getMode(room.mode);
  const modePayload = mode.buildPayload(room, playerId);

  const payload = {
    mode: room.mode,
    modeLabel: mode.label,
    modeDescription: mode.description ?? null,
    roomCode: room.code,
    phase: room.phase,
    players: room.players.map(({ id, name, isHost }) => ({ id, name, isHost })),
    hostId: room.hostId,
    settings: room.settings,
    yourPlayerId: playerId,
    phaseDeadline: room.phaseDeadline,
    ...modePayload,
  };

  if (room.phase === "lobby") {
    payload.availableModes = listModes();
  }

  return payload;
}

module.exports = {
  DEFAULT_MODE_ID,
  getMode,
  listModes,
  applyRoomConfig,
  buildRoomPayload,
};
