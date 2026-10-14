const classic = require("./classic");
const geography = require("./geography");
const { buildSeatInfo } = require("../lib/premiumSeats");
const { hostIsPremium } = require("../lib/hostLimits");

const MODES = {
  [classic.id]: classic,
  [geography.id]: geography,
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

function sanitizeOptionsForRoom(room) {
  return { premium: hostIsPremium(room) };
}

function applyRoomConfig(room, { mode: modeId, settings } = {}) {
  const targetModeId = modeId ?? room.mode;
  const mode = getMode(targetModeId);
  const options = sanitizeOptionsForRoom(room);

  if (modeId && modeId !== room.mode) {
    room.mode = modeId;
    room.state = mode.createInitialState();
    room.settings = mode.sanitizeSettings(
      {
        ...mode.defaultSettings,
        ...settings,
      },
      options
    );
    return;
  }

  if (settings) {
    room.settings = mode.sanitizeSettings(
      {
        ...room.settings,
        ...settings,
      },
      options
    );
  }
}

function buildRoomPayload(room, playerId) {
  const mode = getMode(room.mode);
  const modePayload = mode.buildPayload(room, playerId);
  const you = room.players.find((player) => player.id === playerId);
  const seatInfo = buildSeatInfo(room.players);

  const payload = {
    mode: room.mode,
    modeLabel: mode.label,
    modeDescription: mode.description ?? null,
    roomCode: room.code,
    phase: room.phase,
    players: room.players.map(
      ({ id, name, isHost, animation, victoryAnimation, plan, skinKey }) => ({
        id,
        name,
        isHost,
        animation: animation || "Idle",
        victoryAnimation: victoryAnimation || animation || "Idle",
        plan: plan === "premium" ? "premium" : "free",
        skinKey: skinKey || "default",
      })
    ),
    hostId: room.hostId,
    hostPlan: hostIsPremium(room) ? "premium" : "free",
    yourPlan: you?.plan === "premium" ? "premium" : "free",
    yourUnlockedCosmetics: Array.isArray(you?.unlockedCosmetics)
      ? you.unlockedCosmetics
      : [],
    seatInfo,
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
