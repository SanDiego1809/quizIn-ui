const { getCurrentCluePlayerId } = require("./logic");

const HIDDEN_WHEN_BLIND = new Set([
  "civilian",
  "undercover",
  "fool",
  "detective",
]);

function resolveYourRole(realRole, hideRoles) {
  if (!realRole) return null;
  if (realRole === "mr_white") return "mr_white";
  if (hideRoles && HIDDEN_WHEN_BLIND.has(realRole)) return null;
  if (realRole === "fool") return "undercover";
  return realRole;
}

function buildPayload(room, playerId) {
  const state = room.state || {};
  const settings = room.settings || {};
  const inPlay = room.phase === "playing";
  const subPhase = inPlay ? state.subPhase : null;
  const aliveIds = state.alivePlayerIds || [];
  const youAlive = aliveIds.includes(playerId);
  const hideRoles = Boolean(settings.hideRoles);
  const realRole = inPlay ? state.roleByPlayerId?.[playerId] || null : null;
  const yourRole = inPlay ? resolveYourRole(realRole, hideRoles) : null;

  const showVotes =
    inPlay &&
    (subPhase === "vote" ||
      subPhase === "round_results" ||
      subPhase === "mrwhite_guess");

  const readyMap = state.discussReady || {};
  const readyPlayerIds = aliveIds.filter((id) => readyMap[id]);
  const discussReadyTotal = aliveIds.length
    ? Math.ceil(aliveIds.length / 2)
    : 0;

  const isDetective = realRole === "detective";
  const peekRaw = isDetective
    ? state.detectivePeekResultByPlayerId?.[playerId]
    : null;
  const detectivePeekResult =
    peekRaw == null
      ? null
      : typeof peekRaw === "string"
        ? {
            result: peekRaw,
            targetPlayerId: state.detectivePeekTarget || null,
          }
        : peekRaw;

  const canDetectivePeek =
    inPlay &&
    isDetective &&
    youAlive &&
    (subPhase === "clue" || subPhase === "discuss") &&
    !state.detectivePeekUsed;

  return {
    subPhase,
    currentRound: state.currentRound || 0,
    totalRounds: settings.totalRounds || 0,
    scores: state.scores || { civilians: 0, undercover: 0, mr_white: 0 },
    clues: inPlay ? state.clues || {} : {},
    votes: showVotes ? state.votes || {} : {},
    roundResult: inPlay ? state.roundResult : null,
    result: room.phase === "final_results" ? state.result : null,
    alivePlayerIds: inPlay ? aliveIds : [],
    youAlive: inPlay ? youAlive : true,
    clueOrder: subPhase === "clue" ? state.clueOrder || [] : [],
    clueTurnIndex: subPhase === "clue" ? state.clueTurnIndex : null,
    activeCluePlayerId:
      subPhase === "clue" ? getCurrentCluePlayerId(state) : null,
    yourRole,
    yourWord: inPlay
      ? Object.prototype.hasOwnProperty.call(state.playerWords || {}, playerId)
        ? state.playerWords[playerId]
        : null
      : null,
    isBlankRound: inPlay ? Boolean(state.isBlankRound) : false,
    hideRoles,
    discussionMode: settings.discussionMode || "off",
    requireAccuse: Boolean(settings.requireAccuse),
    speedResolve: Boolean(settings.speedResolve),
    audioPack: Boolean(settings.audioPack),
    discussReadyCount: readyPlayerIds.length,
    discussReadyTotal,
    discussReadyNeeded: discussReadyTotal,
    youDiscussReady: Boolean(readyMap[playerId]),
    accuseNomineeId: inPlay ? state.accuseNomineeId || null : null,
    accuseNominatorId: inPlay ? state.accuseNominatorId || null : null,
    accuseSeconderId: inPlay ? state.accuseSecondedBy || null : null,
    accuseSeconded: inPlay ? Boolean(state.accuseSecondedBy) : false,
    voteRevoteCount: inPlay ? state.voteRevoteCount || 0 : 0,
    canDetectivePeek,
    detectivePeekUsed: isDetective ? Boolean(state.detectivePeekUsed) : false,
    detectivePeekResult,
    yourPairRating: inPlay ? state.pairRatings?.[playerId] || null : null,
    youRatedPair: Boolean(state.pairRatings?.[playerId]),
    wordPairId: inPlay ? state.wordPairId : null,
    sfxEvent: state.sfxEvent || null,
    achievements:
      room.phase === "final_results"
        ? state.result?.achievements || state.achievementsUnlocked || []
        : state.roundResult?.achievements || [],
    achievementsUnlocked: state.achievementsUnlocked || [],
    revealDone: inPlay ? Boolean(state.revealDone) : true,
  };
}

module.exports = { buildPayload, resolveYourRole };
