const WORD_BANK = require("./wordPairs.json");
const { clearRoomTimer } = require("../../lib/timers");
const { PRESETS } = require("./presets");
const { recordPairRating, normalizeRating } = require("./pairRatings");

const WORD_LANGS = new Set(["en", "fr", "es"]);
const WORD_CATEGORIES = new Set([
  "all",
  "easy",
  "family",
  "classic",
  "funny",
  "food",
]);
const BLANK_MODES = new Set(["off", "random"]);
const DISCUSSION_MODES = new Set(["off", "timer", "ready"]);
const TIE_BEHAVIORS = new Set(["revote", "skip"]);
const WORD_SOURCES = new Set(["bank", "custom", "mixed"]);
const FORBIDDEN_CLUE = /waiting\s+for/i;
const BLANK_ROUND_CHANCE = 0.2;
const MAX_CUSTOM_PAIRS = 50;
const MAX_REVOTES = 2;
const CIVILIAN_SIDE_ROLES = new Set(["civilian", "fool", "detective"]);
/** Fool reads as special for detective peek only. */
const PEEK_SPECIAL_ROLES = new Set(["undercover", "mr_white", "fool"]);

function shuffle(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function toBoundedNumber(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function toBool(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string") {
    const s = value.toLowerCase().trim();
    if (s === "true" || s === "1" || s === "on" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "off" || s === "no" || s === "") {
      return false;
    }
  }
  return Boolean(value);
}

function sanitizeAudioPack(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string") {
    const s = value.toLowerCase().trim();
    if (!s || s === "off" || s === "false" || s === "0") return false;
    if (s === "on" || s === "true" || s === "1") return true;
    return s;
  }
  return Boolean(value);
}

function resolveLocalized(entry, lang) {
  if (entry == null) return null;
  if (typeof entry === "string") return entry;
  if (typeof entry !== "object") return null;
  return entry[lang] || entry.en || Object.values(entry)[0] || null;
}

function normalizeClueText(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function sanitizeCustomWordPairs(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const common = String(raw.common || "").trim().slice(0, 80);
    const undercover = String(raw.undercover || "").trim().slice(0, 80);
    if (!common || !undercover) continue;
    if (normalizeClueText(common) === normalizeClueText(undercover)) continue;
    out.push({ common, undercover });
    if (out.length >= MAX_CUSTOM_PAIRS) break;
  }
  return out;
}

function bankPairsForCategory(category) {
  const pool = (WORD_BANK.pairs || []).filter((pair) =>
    category === "all" ? true : pair.category === category
  );
  return pool.length ? pool : WORD_BANK.pairs || [];
}

function customPairsAsBankEntries(customPairs) {
  return (customPairs || []).map((pair, index) => ({
    id: `custom-${index}-${normalizeClueText(pair.common)}-${normalizeClueText(pair.undercover)}`,
    category: "custom",
    common: pair.common,
    undercover: pair.undercover,
  }));
}

function pickWordPair(settings) {
  const category = settings.wordCategory || "all";
  const source = settings.wordSource || "bank";
  const custom = customPairsAsBankEntries(settings.customWordPairs || []);
  const bank = bankPairsForCategory(category);

  let pool = bank;
  if (source === "custom") {
    pool = custom.length ? custom : bank;
  } else if (source === "mixed") {
    pool = custom.length ? [...bank, ...custom] : bank;
  }

  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function createInitialState() {
  return {
    subPhase: null,
    currentRound: 0,
    scores: { civilians: 0, undercover: 0, mr_white: 0 },
    playerScores: {},
    clues: {},
    votes: {},
    roundResult: null,
    result: null,
    undercoverPlayerIds: [],
    mrWhitePlayerIds: [],
    foolPlayerIds: [],
    detectivePlayerIds: [],
    roleByPlayerId: {},
    playerWords: {},
    commonWord: null,
    undercoverWord: null,
    clueOrder: [],
    clueTurnIndex: 0,
    alivePlayerIds: [],
    mrWhiteGuessSubmitted: false,
    wordPairId: null,
    isBlankRound: false,
    discussReady: {},
    accuseNomineeId: null,
    accuseNominatorId: null,
    accuseSecondedBy: null,
    voteRevoteCount: 0,
    detectivePeekUsed: false,
    detectivePeekTarget: null,
    detectivePeekResultByPlayerId: {},
    pairRatings: {},
    achievementsUnlocked: [],
    revealDone: false,
    roundEliminatedRoles: [],
    sfxEvent: null,
  };
}

function sanitizeSettings(input = {}, defaults = {}, _options = {}) {
  const wordLang = WORD_LANGS.has(String(input.wordLang || "").toLowerCase())
    ? String(input.wordLang).toLowerCase()
    : defaults.wordLang || "en";
  const wordCategory = WORD_CATEGORIES.has(
    String(input.wordCategory || "").toLowerCase()
  )
    ? String(input.wordCategory).toLowerCase()
    : defaults.wordCategory || "all";

  const blankRaw = String(
    input.blankRounds ?? defaults.blankRounds ?? "off"
  ).toLowerCase();
  const blankRounds = BLANK_MODES.has(blankRaw) ? blankRaw : "off";

  const discussRaw = String(
    input.discussionMode ?? defaults.discussionMode ?? "off"
  ).toLowerCase();
  const discussionMode = DISCUSSION_MODES.has(discussRaw) ? discussRaw : "off";

  const tieRaw = String(
    input.tieBehavior ?? defaults.tieBehavior ?? "revote"
  ).toLowerCase();
  const tieBehavior = TIE_BEHAVIORS.has(tieRaw) ? tieRaw : "revote";

  const sourceRaw = String(
    input.wordSource ?? defaults.wordSource ?? "bank"
  ).toLowerCase();
  const wordSource = WORD_SOURCES.has(sourceRaw) ? sourceRaw : "bank";

  return {
    clueTimeSeconds: toBoundedNumber(
      input.clueTimeSeconds,
      defaults.clueTimeSeconds ?? 0,
      0,
      180
    ),
    voteTimeSeconds: toBoundedNumber(
      input.voteTimeSeconds,
      defaults.voteTimeSeconds ?? 0,
      0,
      180
    ),
    totalRounds: toBoundedNumber(
      input.totalRounds,
      defaults.totalRounds ?? 3,
      1,
      10
    ),
    undercoverCount: toBoundedNumber(
      input.undercoverCount,
      defaults.undercoverCount ?? 1,
      0,
      5
    ),
    mrWhiteCount: toBoundedNumber(
      input.mrWhiteCount,
      defaults.mrWhiteCount ?? 0,
      0,
      2
    ),
    foolCount: toBoundedNumber(
      input.foolCount,
      defaults.foolCount ?? 0,
      0,
      1
    ),
    detectiveCount: toBoundedNumber(
      input.detectiveCount,
      defaults.detectiveCount ?? 0,
      0,
      1
    ),
    wordCategory,
    wordLang,
    hideRoles: toBool(input.hideRoles, defaults.hideRoles ?? false),
    blankRounds,
    discussionMode,
    discussionTimeSeconds: toBoundedNumber(
      input.discussionTimeSeconds,
      defaults.discussionTimeSeconds ?? 45,
      0,
      180
    ),
    requireAccuse: toBool(
      input.requireAccuse,
      defaults.requireAccuse ?? false
    ),
    accuseTimeSeconds: toBoundedNumber(
      input.accuseTimeSeconds,
      defaults.accuseTimeSeconds ?? 30,
      0,
      120
    ),
    tieBehavior,
    banSecretWord: toBool(
      input.banSecretWord,
      defaults.banSecretWord ?? true
    ),
    banDuplicateClue: toBool(
      input.banDuplicateClue,
      defaults.banDuplicateClue ?? true
    ),
    clueMaxChars: toBoundedNumber(
      input.clueMaxChars,
      defaults.clueMaxChars ?? 40,
      0,
      120
    ),
    clueOneWord: toBool(input.clueOneWord, defaults.clueOneWord ?? false),
    speedResolve: toBool(input.speedResolve, defaults.speedResolve ?? false),
    wordSource,
    customWordPairs: sanitizeCustomWordPairs(
      input.customWordPairs ?? defaults.customWordPairs
    ),
    audioPack: sanitizeAudioPack(input.audioPack, defaults.audioPack ?? false),
  };
}

function validateStart(room) {
  if (room.players.length < 3) {
    return { ok: false, message: "Need at least 3 players to start." };
  }
  const settings = room.settings || {};
  const undercover = Number(settings.undercoverCount) || 0;
  const mrWhite = Number(settings.mrWhiteCount) || 0;
  const fool = Number(settings.foolCount) || 0;
  const detective = Number(settings.detectiveCount) || 0;

  if (undercover + mrWhite < 1) {
    return {
      ok: false,
      message: "Add at least one Undercover or Mr White.",
    };
  }
  if (undercover + mrWhite + fool + detective >= room.players.length) {
    return {
      ok: false,
      message: "Leave at least one civilian seat.",
    };
  }
  if (
    settings.wordSource === "custom" &&
    !(settings.customWordPairs || []).length
  ) {
    return {
      ok: false,
      message: "Add custom word pairs or switch word source to bank.",
    };
  }
  return { ok: true };
}

function getAlivePlayers(room) {
  const alive = new Set(room.state.alivePlayerIds || []);
  return room.players.filter((p) => alive.has(p.id));
}

function getCurrentCluePlayerId(state) {
  if (!state.clueOrder?.length) return null;
  return state.clueOrder[state.clueTurnIndex] || null;
}

/** Only undercover + mr_white are special for win math (not fool, not detective). */
function specialRolesAmong(state, playerIds) {
  const set = new Set(playerIds);
  let undercover = 0;
  let mrWhite = 0;
  let civilians = 0;
  for (const id of set) {
    const role = state.roleByPlayerId[id];
    if (role === "undercover") undercover += 1;
    else if (role === "mr_white") mrWhite += 1;
    else civilians += 1;
  }
  return { undercover, mrWhite, civilians, special: undercover + mrWhite };
}

function isOnCivilianSide(role) {
  return CIVILIAN_SIDE_ROLES.has(role);
}

function playerListForIds(room, ids) {
  const set = new Set(ids || []);
  return room.players
    .filter((p) => set.has(p.id))
    .map((p) => ({ id: p.id, name: p.name }));
}

function scheduleClueTurn(room, ctx) {
  clearRoomTimer(room);
  const state = room.state;
  if (state.subPhase !== "clue") return;
  const activeId = getCurrentCluePlayerId(state);
  if (!activeId) return;
  state.sfxEvent = { id: "your_turn", at: Date.now() };
  const seconds = room.settings.clueTimeSeconds;
  if (seconds <= 0) {
    room.phaseDeadline = null;
    return;
  }
  const roomCode = room.code;
  room.phaseDeadline = Date.now() + seconds * 1000;
  room.phaseTimeoutId = setTimeout(() => {
    const current = ctx.rooms.get(roomCode);
    if (!current || current.phase !== "playing") return;
    if (current.state.subPhase !== "clue") return;
    const currentId = getCurrentCluePlayerId(current.state);
    if (currentId !== activeId) return;
    if (!current.state.clues[activeId]) {
      current.state.clues[activeId] = "(skipped)";
    }
    advanceClueTurn(current, ctx);
    ctx.emitRoom(roomCode);
  }, seconds * 1000);
}

function startVotePhase(room, ctx) {
  clearRoomTimer(room);
  const state = room.state;
  state.subPhase = "vote";
  state.votes = {};
  room.phaseDeadline = null;

  const seconds = room.settings.voteTimeSeconds;
  if (seconds <= 0) return;

  const roomCode = room.code;
  room.phaseDeadline = Date.now() + seconds * 1000;
  room.phaseTimeoutId = setTimeout(() => {
    const current = ctx.rooms.get(roomCode);
    if (!current || current.phase !== "playing") return;
    if (current.state.subPhase !== "vote") return;
    const alive = getAlivePlayers(current);
    for (const p of alive) {
      if (current.state.votes[p.id]) continue;
      const others = alive.filter((x) => x.id !== p.id);
      if (others.length) {
        current.state.votes[p.id] =
          others[Math.floor(Math.random() * others.length)].id;
      }
    }
    clearRoomTimer(current);
    current.phaseDeadline = null;
    finalizeVote(current, ctx);
    ctx.emitRoom(roomCode);
  }, seconds * 1000);
}

function startDiscussPhase(room, ctx) {
  clearRoomTimer(room);
  const state = room.state;
  state.subPhase = "discuss";
  state.discussReady = {};
  room.phaseDeadline = null;

  if (room.settings.discussionMode !== "timer") return;

  const seconds = room.settings.discussionTimeSeconds;
  if (seconds <= 0) {
    proceedToAccuseOrVote(room, ctx);
    return;
  }

  const roomCode = room.code;
  room.phaseDeadline = Date.now() + seconds * 1000;
  room.phaseTimeoutId = setTimeout(() => {
    const current = ctx.rooms.get(roomCode);
    if (!current || current.phase !== "playing") return;
    if (current.state.subPhase !== "discuss") return;
    proceedToAccuseOrVote(current, ctx);
    ctx.emitRoom(roomCode);
  }, seconds * 1000);
}

function startAccusePhase(room, ctx) {
  clearRoomTimer(room);
  const state = room.state;
  state.subPhase = "accuse";
  state.accuseNomineeId = null;
  state.accuseSecondedBy = null;
  room.phaseDeadline = null;

  const seconds = room.settings.accuseTimeSeconds;
  if (seconds <= 0) return;

  const roomCode = room.code;
  room.phaseDeadline = Date.now() + seconds * 1000;
  room.phaseTimeoutId = setTimeout(() => {
    const current = ctx.rooms.get(roomCode);
    if (!current || current.phase !== "playing") return;
    if (current.state.subPhase !== "accuse") return;
    beginCluePass(current, ctx);
    ctx.emitRoom(roomCode);
  }, seconds * 1000);
}

function proceedToAccuseOrVote(room, ctx) {
  if (room.settings.requireAccuse) {
    startAccusePhase(room, ctx);
  } else {
    startVotePhase(room, ctx);
  }
}

function afterClues(room, ctx) {
  const mode = room.settings.discussionMode || "off";
  if (mode === "timer" || mode === "ready") {
    startDiscussPhase(room, ctx);
    return;
  }
  proceedToAccuseOrVote(room, ctx);
}

function advanceClueTurn(room, ctx) {
  clearRoomTimer(room);
  room.phaseDeadline = null;
  const state = room.state;
  state.clueTurnIndex += 1;
  if (state.clueTurnIndex >= state.clueOrder.length) {
    afterClues(room, ctx);
  } else {
    scheduleClueTurn(room, ctx);
  }
}

function awardRoundWin(room, winner) {
  const state = room.state;
  state.scores[winner] = (state.scores[winner] || 0) + 1;
  for (const player of room.players) {
    const role = state.roleByPlayerId[player.id];
    const onWinningSide =
      (winner === "civilians" && isOnCivilianSide(role)) ||
      (winner === "undercover" && role === "undercover") ||
      (winner === "mr_white" && role === "mr_white");
    if (onWinningSide) {
      state.playerScores[player.id] = (state.playerScores[player.id] || 0) + 1;
    }
  }
}

function computeRoundAchievements(room, winner, extra = {}) {
  const state = room.state;
  const settings = room.settings || {};
  const alive = new Set(state.alivePlayerIds || []);
  const eliminatedRoles = state.roundEliminatedRoles || [];
  const eliminatedCivilianSide = eliminatedRoles.some((r) =>
    isOnCivilianSide(r)
  );

  return {
    perfectCivilianTable: winner === "civilians" && !eliminatedCivilianSide,
    mrWhiteClutch: winner === "mr_white" && Boolean(extra.mrWhiteGuessCorrect),
    foolSurvived:
      (state.foolPlayerIds || []).some((id) => alive.has(id)) &&
      winner === "civilians",
    wonWhileBlind: Boolean(settings.hideRoles),
    survivedBlankRound:
      Boolean(state.isBlankRound) &&
      room.players.some((p) => {
        if (!alive.has(p.id)) return false;
        const role = state.roleByPlayerId[p.id];
        return (
          (winner === "civilians" && isOnCivilianSide(role)) ||
          (winner === "undercover" && role === "undercover") ||
          (winner === "mr_white" && role === "mr_white")
        );
      }),
  };
}

function mergeAchievements(state, roundAchievements) {
  if (!Array.isArray(state.achievementsUnlocked)) {
    state.achievementsUnlocked = [];
  }
  for (const [key, value] of Object.entries(roundAchievements || {})) {
    if (value && !state.achievementsUnlocked.includes(key)) {
      state.achievementsUnlocked.push(key);
    }
  }
}

function buildRoundResult(room, extra = {}) {
  const state = room.state;
  return {
    ...extra,
    round: state.currentRound,
    totalRounds: room.settings.totalRounds,
    isGameOver: state.currentRound >= room.settings.totalRounds,
    undercoverPlayers: playerListForIds(room, state.undercoverPlayerIds),
    mrWhitePlayers: playerListForIds(room, state.mrWhitePlayerIds),
    foolPlayers: playerListForIds(room, state.foolPlayerIds),
    detectivePlayers: playerListForIds(room, state.detectivePlayerIds),
    commonWord: state.commonWord,
    undercoverWord: state.undercoverWord,
    isBlankRound: Boolean(state.isBlankRound),
    wordPairId: state.wordPairId,
    scores: { ...state.scores },
    achievements: extra.achievements || null,
  };
}

function enterRoundResults(room, winner, extra = {}) {
  clearRoomTimer(room);
  room.phaseDeadline = null;
  awardRoundWin(room, winner);
  const achievements = computeRoundAchievements(room, winner, extra);
  mergeAchievements(room.state, achievements);
  room.state.subPhase = "round_results";
  room.state.roundResult = buildRoundResult(room, {
    winner,
    ...extra,
    achievements,
  });
}

function beginCluePass(room, ctx) {
  const state = room.state;
  const alive = getAlivePlayers(room);
  state.subPhase = "clue";
  state.clues = {};
  state.votes = {};
  state.roundResult = null;
  state.mrWhiteGuessSubmitted = false;
  state.discussReady = {};
  state.accuseNomineeId = null;
  state.accuseNominatorId = null;
  state.accuseSecondedBy = null;
  state.voteRevoteCount = 0;
  state.clueOrder = shuffle(alive.map((p) => p.id));
  state.clueTurnIndex = 0;
  scheduleClueTurn(room, ctx);
}

function checkEliminationEnd(room) {
  const state = room.state;
  const counts = specialRolesAmong(state, state.alivePlayerIds || []);
  if (counts.special === 0) {
    return { done: true, winner: "civilians" };
  }
  if (counts.special >= counts.civilians) {
    return {
      done: true,
      winner: counts.undercover > 0 ? "undercover" : "mr_white",
    };
  }
  return { done: false };
}

function markEliminated(room, eliminatedId, eliminatedRole) {
  const state = room.state;
  if (eliminatedId) {
    state.alivePlayerIds = (state.alivePlayerIds || []).filter(
      (id) => id !== eliminatedId
    );
  }
  if (eliminatedRole) {
    if (!Array.isArray(state.roundEliminatedRoles)) {
      state.roundEliminatedRoles = [];
    }
    state.roundEliminatedRoles.push(eliminatedRole);
  }
}

function resolveAfterElimination(
  room,
  ctx,
  eliminatedId,
  eliminatedRole,
  extra
) {
  if (room.settings.speedResolve) {
    let winner = "undercover";
    if (eliminatedRole === "undercover") winner = "civilians";
    else if (isOnCivilianSide(eliminatedRole)) winner = "undercover";
    else if (eliminatedRole === "mr_white") winner = "civilians";
    enterRoundResults(room, winner, {
      eliminatedPlayerId: eliminatedId,
      eliminatedPlayerName: extra.eliminatedPlayerName || "No one",
      eliminatedRole,
      ...extra,
    });
    return;
  }

  const end = checkEliminationEnd(room);
  if (!end.done) {
    beginCluePass(room, ctx);
    return;
  }
  enterRoundResults(room, end.winner, {
    eliminatedPlayerId: eliminatedId,
    eliminatedPlayerName: extra.eliminatedPlayerName || "No one",
    eliminatedRole,
    ...extra,
  });
}

function finalizeVote(room, ctx) {
  const state = room.state;
  const alive = getAlivePlayers(room);
  const tally = {};
  for (const voter of alive) {
    const target = state.votes[voter.id];
    if (!target) continue;
    tally[target] = (tally[target] || 0) + 1;
  }

  let maxVotes = -1;
  const leaders = [];
  for (const [candidateId, count] of Object.entries(tally)) {
    if (count > maxVotes) {
      maxVotes = count;
      leaders.length = 0;
      leaders.push(candidateId);
    } else if (count === maxVotes) {
      leaders.push(candidateId);
    }
  }

  if (leaders.length !== 1 || maxVotes < 1) {
    const behavior = room.settings.tieBehavior || "revote";
    if (behavior === "revote") {
      state.voteRevoteCount = (state.voteRevoteCount || 0) + 1;
      if (state.voteRevoteCount < MAX_REVOTES) {
        state.votes = {};
        startVotePhase(room, ctx);
        return;
      }
    }
    beginCluePass(room, ctx);
    return;
  }

  const eliminatedId = leaders[0];
  const eliminated = room.players.find((p) => p.id === eliminatedId);
  const eliminatedRole = state.roleByPlayerId[eliminatedId] || null;
  const elimExtra = {
    eliminatedPlayerId: eliminatedId,
    eliminatedPlayerName: eliminated?.name || "No one",
    eliminatedRole,
  };
  state.sfxEvent = { id: "elimination", at: Date.now() };

  if (eliminatedRole === "mr_white") {
    clearRoomTimer(room);
    room.phaseDeadline = null;
    markEliminated(room, eliminatedId, eliminatedRole);
    state.subPhase = "mrwhite_guess";
    state.roundResult = buildRoundResult(room, {
      awaitingMrWhiteGuess: true,
      ...elimExtra,
    });
    return;
  }

  markEliminated(room, eliminatedId, eliminatedRole);
  resolveAfterElimination(room, ctx, eliminatedId, eliminatedRole, elimExtra);
}

function finalizeMrWhiteGuess(room, guess) {
  const state = room.state;
  const normalizedGuess = String(guess || "").trim().toLowerCase();
  const normalizedWord = String(state.commonWord || "").trim().toLowerCase();
  const guessCorrect =
    Boolean(normalizedGuess) && normalizedGuess === normalizedWord;

  const elimExtra = {
    mrWhiteGuess: guess,
    mrWhiteGuessCorrect: guessCorrect,
    eliminatedPlayerId:
      state.roundResult?.eliminatedPlayerId ||
      state.mrWhitePlayerIds[0] ||
      null,
    eliminatedPlayerName:
      state.roundResult?.eliminatedPlayerName ||
      room.players.find((p) => state.mrWhitePlayerIds.includes(p.id))?.name ||
      "No one",
    eliminatedRole: "mr_white",
  };

  if (guessCorrect) {
    state.sfxEvent = { id: "mr_white_correct", at: Date.now() };
    enterRoundResults(room, "mr_white", elimExtra);
    return { continueElimination: false };
  }

  if (room.settings.speedResolve) {
    enterRoundResults(room, "civilians", elimExtra);
    return { continueElimination: false };
  }

  const end = checkEliminationEnd(room);
  if (!end.done) {
    state.roundResult = null;
    return { continueElimination: true };
  }
  enterRoundResults(room, end.winner, elimExtra);
  return { continueElimination: false };
}

function beginRound(room, roundNumber, ctx) {
  clearRoomTimer(room);
  const pair = pickWordPair(room.settings);
  if (!pair) {
    throw new Error("No word pairs available.");
  }

  const lang = room.settings.wordLang || "en";
  const commonWord = resolveLocalized(pair.common, lang);
  const undercoverWord = resolveLocalized(pair.undercover, lang);

  const n = room.players.length;
  let undercoverCount = Math.min(room.settings.undercoverCount, n - 1);
  let mrWhiteCount = Math.min(
    room.settings.mrWhiteCount,
    n - undercoverCount - 1
  );
  let foolCount = Math.min(
    room.settings.foolCount || 0,
    n - undercoverCount - mrWhiteCount - 1
  );
  let detectiveCount = Math.min(
    room.settings.detectiveCount || 0,
    n - undercoverCount - mrWhiteCount - foolCount - 1
  );

  if (undercoverCount + mrWhiteCount < 1) {
    undercoverCount = Math.min(1, n - 1);
    mrWhiteCount = 0;
    foolCount = Math.min(foolCount, n - undercoverCount - 1);
    detectiveCount = Math.min(
      detectiveCount,
      n - undercoverCount - foolCount - 1
    );
  }

  const shuffled = shuffle(room.players.map((p) => p.id));
  let cursor = 0;
  const mrWhitePlayerIds = shuffled.slice(cursor, cursor + mrWhiteCount);
  cursor += mrWhiteCount;
  const undercoverPlayerIds = shuffled.slice(cursor, cursor + undercoverCount);
  cursor += undercoverCount;
  const foolPlayerIds = shuffled.slice(cursor, cursor + foolCount);
  cursor += foolCount;
  const detectivePlayerIds = shuffled.slice(cursor, cursor + detectiveCount);

  const blankRoll =
    room.settings.blankRounds === "random" &&
    Math.random() < BLANK_ROUND_CHANCE;

  const state = room.state;
  state.currentRound = roundNumber;
  state.clues = {};
  state.votes = {};
  state.roundResult = null;
  state.undercoverPlayerIds = undercoverPlayerIds;
  state.mrWhitePlayerIds = mrWhitePlayerIds;
  state.foolPlayerIds = foolPlayerIds;
  state.detectivePlayerIds = detectivePlayerIds;
  state.roleByPlayerId = {};
  state.playerWords = {};
  state.commonWord = commonWord;
  state.undercoverWord = undercoverWord;
  state.wordPairId = pair.id || null;
  state.mrWhiteGuessSubmitted = false;
  state.alivePlayerIds = room.players.map((p) => p.id);
  state.isBlankRound = blankRoll;
  state.discussReady = {};
  state.accuseNomineeId = null;
  state.accuseNominatorId = null;
  state.accuseSecondedBy = null;
  state.voteRevoteCount = 0;
  state.detectivePeekUsed = false;
  state.detectivePeekTarget = null;
  state.detectivePeekResultByPlayerId = {};
  state.pairRatings = {};
  state.revealDone = false;
  state.roundEliminatedRoles = [];
  state.sfxEvent = blankRoll
    ? { id: "blank_round", at: Date.now() }
    : null;

  for (const p of room.players) {
    if (mrWhitePlayerIds.includes(p.id)) {
      state.roleByPlayerId[p.id] = "mr_white";
      state.playerWords[p.id] = null;
    } else if (undercoverPlayerIds.includes(p.id)) {
      state.roleByPlayerId[p.id] = "undercover";
      state.playerWords[p.id] = undercoverWord;
    } else if (foolPlayerIds.includes(p.id)) {
      state.roleByPlayerId[p.id] = "fool";
      state.playerWords[p.id] = undercoverWord;
    } else if (detectivePlayerIds.includes(p.id)) {
      state.roleByPlayerId[p.id] = "detective";
      state.playerWords[p.id] = commonWord;
    } else {
      state.roleByPlayerId[p.id] = "civilian";
      state.playerWords[p.id] = commonWord;
    }
  }

  if (blankRoll) {
    for (const p of room.players) {
      state.playerWords[p.id] = null;
    }
  }

  room.phase = "playing";
  state.subPhase = "reveal";
  const roomCode = room.code;
  room.phaseDeadline = Date.now() + 2800;
  room.phaseTimeoutId = setTimeout(() => {
    const current = ctx.rooms.get(roomCode);
    if (!current || current.phase !== "playing") return;
    if (current.state.subPhase !== "reveal") return;
    current.state.revealDone = true;
    beginCluePass(current, ctx);
    ctx.emitRoom(roomCode);
  }, 2800);
}

function buildMatchResult(room) {
  const state = room.state;
  const rankings = room.players
    .map((player) => ({
      playerId: player.id,
      name: player.name,
      score: state.playerScores[player.id] || 0,
      teamId: null,
    }))
    .sort((a, b) => b.score - a.score);

  return {
    rankings,
    playerRankings: rankings,
    teamRankings: null,
    versus: false,
    totalQuestions: room.settings.totalRounds,
    maxScore: room.settings.totalRounds,
    factionScores: { ...state.scores },
    achievements: [...(state.achievementsUnlocked || [])],
  };
}

function finishMatch(room) {
  clearRoomTimer(room);
  room.phaseDeadline = null;
  room.phase = "final_results";
  room.state.subPhase = null;
  room.state.result = buildMatchResult(room);

  try {
    const { persistGameResults } = require("../../lib/persistGameResults");
    void persistGameResults(room);
  } catch (err) {
    console.error("[undercover] persistGameResults", err);
  }
}

function start(room, ctx) {
  room.state = createInitialState();
  for (const player of room.players) {
    room.state.playerScores[player.id] = 0;
  }
  beginRound(room, 1, ctx);
}

function reset(room) {
  clearRoomTimer(room);
  room.phase = "lobby";
  room.phaseDeadline = null;
  room.state = createInitialState();
}

function validateClue(room, playerId, rawClue) {
  const settings = room.settings || {};
  const state = room.state;
  const trimmed = String(rawClue || "").trim();
  if (!trimmed) {
    return { ok: false, message: "Enter a clue before submitting." };
  }
  if (FORBIDDEN_CLUE.test(trimmed)) {
    return {
      ok: false,
      message: 'Clues cannot contain the phrase "waiting for".',
    };
  }

  const maxChars = settings.clueMaxChars > 0 ? settings.clueMaxChars : 120;
  if (trimmed.length > maxChars) {
    return {
      ok: false,
      message: `Clue must be at most ${maxChars} characters.`,
    };
  }

  if (settings.clueOneWord && /\s/.test(trimmed)) {
    return { ok: false, message: "Clue must be a single word." };
  }

  const normalized = normalizeClueText(trimmed);

  if (settings.banDuplicateClue) {
    for (const [otherId, otherClue] of Object.entries(state.clues || {})) {
      if (String(otherId) === String(playerId)) continue;
      if (otherClue === "(skipped)") continue;
      if (normalizeClueText(otherClue) === normalized) {
        return {
          ok: false,
          message: "That clue was already used this pass.",
        };
      }
    }
  }

  if (settings.banSecretWord && !state.isBlankRound) {
    const banned = [
      state.playerWords[playerId],
      state.commonWord,
      state.undercoverWord,
    ]
      .filter(Boolean)
      .map((w) => normalizeClueText(w));
    if (banned.includes(normalized)) {
      return {
        ok: false,
        message: "Clue cannot be the secret word.",
      };
    }
  }

  return { ok: true, clue: trimmed.slice(0, maxChars) };
}

function majorityReady(room) {
  const alive = getAlivePlayers(room);
  if (!alive.length) return false;
  const readyCount = alive.filter((p) => room.state.discussReady?.[p.id]).length;
  return readyCount >= Math.floor(alive.length / 2) + 1;
}

function handleAction(room, action, ctx) {
  const type = String(action?.type || "");
  const playerId = action.playerId;
  const state = room.state;

  if (type === "apply_preset") {
    if (room.phase !== "lobby") {
      return { ok: false, message: "Presets can only be applied in the lobby." };
    }
    if (playerId !== room.hostId) {
      return { ok: false, message: "Only the host can apply a preset." };
    }
    const key = String(action.preset || action.presetId || "").trim();
    const patch = PRESETS[key];
    if (!patch) {
      return { ok: false, message: `Unknown preset: ${key}` };
    }
    room.settings = sanitizeSettings(
      { ...room.settings, ...patch },
      room.settings
    );
    return { ok: true };
  }

  if (type === "rematch") {
    if (room.phase !== "final_results") {
      return {
        ok: false,
        message: "Rematch is only available after the match ends.",
      };
    }
    if (playerId !== room.hostId) {
      return { ok: false, message: "Only the host can start a rematch." };
    }
    start(room, ctx);
    return { ok: true };
  }

  if (type === "clue_submit") {
    if (room.phase !== "playing" || state.subPhase !== "clue") {
      return { ok: false, message: "Not in clue phase." };
    }
    if (!state.alivePlayerIds.includes(playerId)) {
      return { ok: false, message: "You are out of this round." };
    }
    const currentId = getCurrentCluePlayerId(state);
    if (String(playerId) !== String(currentId)) {
      return { ok: false, message: "It is not your turn to give a clue." };
    }
    if (state.clues[playerId]) return { ok: true };

    const check = validateClue(room, playerId, action.clue);
    if (!check.ok) return check;

    state.clues[playerId] = check.clue;
    advanceClueTurn(room, ctx);
    return { ok: true };
  }

  if (type === "discuss_ready") {
    if (room.phase !== "playing" || state.subPhase !== "discuss") {
      return { ok: false, message: "Not in discussion phase." };
    }
    if (room.settings.discussionMode !== "ready") {
      return { ok: false, message: "Ready lock is not enabled." };
    }
    if (!state.alivePlayerIds.includes(playerId)) {
      return { ok: false, message: "You are out of this round." };
    }
    state.discussReady[playerId] = true;
    if (majorityReady(room)) {
      proceedToAccuseOrVote(room, ctx);
    }
    return { ok: true };
  }

  if (type === "accuse_nominate") {
    if (room.phase !== "playing" || state.subPhase !== "accuse") {
      return { ok: false, message: "Not in accuse phase." };
    }
    if (!state.alivePlayerIds.includes(playerId)) {
      return { ok: false, message: "You are out of this round." };
    }
    if (state.accuseNomineeId) {
      return { ok: false, message: "Someone is already nominated." };
    }
    const target = String(action.targetPlayerId || action.nomineeId || "");
    if (!state.alivePlayerIds.includes(target)) {
      return { ok: false, message: "Invalid nomination target." };
    }
    if (String(playerId) === target) {
      return { ok: false, message: "You cannot nominate yourself." };
    }
    state.accuseNomineeId = target;
    state.accuseNominatorId = playerId;
    state.accuseSecondedBy = null;
    return { ok: true };
  }

  if (type === "accuse_second") {
    if (room.phase !== "playing" || state.subPhase !== "accuse") {
      return { ok: false, message: "Not in accuse phase." };
    }
    if (!state.alivePlayerIds.includes(playerId)) {
      return { ok: false, message: "You are out of this round." };
    }
    if (!state.accuseNomineeId) {
      return { ok: false, message: "No nomination to second." };
    }
    if (String(playerId) === String(state.accuseNomineeId)) {
      return { ok: false, message: "The nominee cannot second." };
    }
    if (state.accuseSecondedBy) return { ok: true };
    state.accuseSecondedBy = playerId;
    clearRoomTimer(room);
    room.phaseDeadline = null;
    startVotePhase(room, ctx);
    return { ok: true };
  }

  if (type === "detective_peek") {
    if (room.phase !== "playing") {
      return { ok: false, message: "Game is not in play." };
    }
    if (state.subPhase !== "clue" && state.subPhase !== "discuss") {
      return {
        ok: false,
        message: "Peek is only available during clue or discussion.",
      };
    }
    if (state.roleByPlayerId[playerId] !== "detective") {
      return { ok: false, message: "Only the Detective can peek." };
    }
    if (!state.alivePlayerIds.includes(playerId)) {
      return { ok: false, message: "You are out of this round." };
    }
    if (state.detectivePeekUsed) {
      return { ok: false, message: "You already used your peek this round." };
    }
    const target = String(action.targetPlayerId || "");
    if (!state.alivePlayerIds.includes(target)) {
      return { ok: false, message: "Invalid peek target." };
    }
    if (String(playerId) === target) {
      return { ok: false, message: "You cannot peek yourself." };
    }
    const targetRole = state.roleByPlayerId[target];
    const result = PEEK_SPECIAL_ROLES.has(targetRole) ? "special" : "civilian";
    state.detectivePeekUsed = true;
    state.detectivePeekTarget = target;
    state.detectivePeekResultByPlayerId[playerId] = {
      result,
      targetPlayerId: target,
    };
    return { ok: true, peekResult: result };
  }

  if (type === "vote_submit") {
    if (room.phase !== "playing" || state.subPhase !== "vote") {
      return { ok: false, message: "Not in vote phase." };
    }
    if (!state.alivePlayerIds.includes(playerId)) {
      return { ok: false, message: "You are out of this round." };
    }
    const target = String(action.targetPlayerId || "");
    if (!state.alivePlayerIds.includes(target)) {
      return { ok: false, message: "Invalid vote target." };
    }
    if (String(playerId) === target) {
      return { ok: false, message: "You cannot vote for yourself." };
    }
    if (state.votes[playerId]) return { ok: true };
    state.votes[playerId] = target;
    state.sfxEvent = { id: "vote_locked", at: Date.now() };

    const alive = getAlivePlayers(room);
    if (alive.every((p) => Boolean(state.votes[p.id]))) {
      clearRoomTimer(room);
      room.phaseDeadline = null;
      finalizeVote(room, ctx);
    }
    return { ok: true };
  }

  if (type === "mrwhite_guess_submit") {
    if (room.phase !== "playing" || state.subPhase !== "mrwhite_guess") {
      return { ok: false, message: "Not in Mr White guess phase." };
    }
    if (!state.mrWhitePlayerIds.includes(playerId)) {
      return { ok: false, message: "Only Mr White can guess." };
    }
    if (state.mrWhiteGuessSubmitted) return { ok: true };
    state.mrWhiteGuessSubmitted = true;
    const outcome = finalizeMrWhiteGuess(room, action.guess);
    if (outcome.continueElimination) {
      beginCluePass(room, ctx);
    }
    return { ok: true };
  }

  if (type === "pair_rate") {
    if (room.phase !== "playing" || state.subPhase !== "round_results") {
      return { ok: false, message: "Rate pairs after the round ends." };
    }
    const pairId = state.wordPairId || action.pairId;
    const rating = action.rating ?? action.value ?? action.thumbs;
    const result = recordPairRating(pairId, playerId, rating);
    if (!result.ok) return result;
    state.pairRatings[playerId] = {
      rating: normalizeRating(rating),
      pairId,
    };
    return { ok: true };
  }

  if (type === "round_next") {
    if (room.phase !== "playing" || state.subPhase !== "round_results") {
      return { ok: false, message: "Round is not finished yet." };
    }
    if (playerId !== room.hostId) {
      return { ok: false, message: "Only the host can start the next round." };
    }
    if (state.roundResult?.isGameOver) {
      finishMatch(room);
      return { ok: true };
    }
    beginRound(room, state.currentRound + 1, ctx);
    return { ok: true };
  }

  if (type === "finish_match") {
    if (room.phase !== "playing" || state.subPhase !== "round_results") {
      return { ok: false, message: "Round is not finished yet." };
    }
    if (playerId !== room.hostId) {
      return { ok: false, message: "Only the host can finish the match." };
    }
    finishMatch(room);
    return { ok: true };
  }

  return { ok: false, message: `Unknown action: ${type}` };
}

module.exports = {
  createInitialState,
  sanitizeSettings,
  validateStart,
  start,
  handleAction,
  reset,
  getCurrentCluePlayerId,
  specialRolesAmong,
  pickWordPair,
  WORD_BANK,
  PRESETS,
};
