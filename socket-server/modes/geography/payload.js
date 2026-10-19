const { findCountryByCode } = require("./logic");
const { isTeamsSettings, previewTeams } = require("../../lib/teams");

function questionForClient(country, settings = {}) {
  if (!country) return null;
  const roomVariant = String(settings.variant || "countries").toLowerCase();
  const variant = String(
    country.promptVariant ||
      (roomVariant === "flags" || roomVariant === "capitals"
        ? roomVariant
        : roomVariant === "mixed"
          ? "countries"
          : "countries")
  ).toLowerCase();

  const question = {
    id: country.id,
    countryCode: country.countryCode,
    countryName: country.countryName,
    variant,
  };
  if (variant === "capitals") {
    question.capitalName = country.capitalName || null;
  }
  return question;
}

function resolveAnswerLabel(countryCode) {
  if (!countryCode) return null;
  const country = findCountryByCode(countryCode);
  return {
    countryCode,
    countryName: country ? country.countryName : countryCode.toUpperCase(),
  };
}

function buildPayload(room, playerId) {
  const state = room.state;
  const country = state.countries[state.currentQuestionIndex] ?? null;
  const inPlay = room.phase === "playing" || room.phase === "reveal";
  const answersForCurrent = inPlay
    ? state.answersByQuestion[state.currentQuestionIndex] || {}
    : {};

  const teams =
    room.phase === "playing" ||
    room.phase === "reveal" ||
    room.phase === "final_results"
      ? state.teams
      : isTeamsSettings(room.settings)
        ? previewTeams(room.players)
        : null;

  const yourTeamId =
    teams?.find((team) => team.playerIds.includes(playerId))?.id ?? null;

  const eliminated = state.eliminatedPlayerIds || [];
  const youEliminated = eliminated.includes(playerId);
  const livesActive =
    Boolean(room.settings?.lives) ||
    String(room.settings?.variant || "") === "streak";
  const yourAnswer = answersForCurrent[playerId] || null;
  const yourGuess = yourAnswer?.countryCode
    ? String(yourAnswer.countryCode).toLowerCase()
    : null;
  const yourGuessKind = yourAnswer?.kind || null;

  const payload = {
    scores: state.scores,
    teams,
    yourTeamId,
    currentQuestionIndex: inPlay ? state.currentQuestionIndex : null,
    totalQuestions: state.countries.length || room.settings.questionsPerGame,
    question: inPlay ? questionForClient(country, room.settings) : null,
    hasAnswered: inPlay ? yourAnswer !== null : false,
    yourGuess: inPlay ? yourGuess : null,
    yourGuessKind: room.phase === "reveal" ? yourGuessKind : null,
    answeredPlayerIds: inPlay ? Object.keys(answersForCurrent) : [],
    answeredCount: inPlay ? Object.keys(answersForCurrent).length : 0,
    result: state.result,
    livesByPlayer: livesActive ? state.livesByPlayer || {} : {},
    yourLives: livesActive ? (state.livesByPlayer?.[playerId] ?? null) : null,
    eliminatedPlayerIds: eliminated,
    youEliminated,
    reveal: room.phase === "reveal" ? state.reveal : null,
    settingsFlags: {
      silhouette: Boolean(room.settings?.silhouette),
      revealHeat: Boolean(room.settings?.revealHeat),
      lives: livesActive,
      neighborMiss: Boolean(room.settings?.neighborMiss),
      harderPool: Boolean(room.settings?.harderPool),
    },
  };

  if (room.phase === "final_results" && state.countries.length) {
    payload.questionReview = state.countries.map((entry, index) => {
      const rawAnswers = state.answersByQuestion[index] || {};
      const answers = Object.fromEntries(
        Object.entries(rawAnswers)
          .filter(([, answer]) => answer && answer.countryCode)
          .map(([pid, answer]) => [pid, resolveAnswerLabel(answer.countryCode)])
      );
      return {
        id: entry.id,
        countryCode: entry.countryCode,
        countryName: entry.countryName,
        capitalName: entry.capitalName || null,
        correctCode: entry.countryCode,
        promptVariant: entry.promptVariant || null,
        answers,
      };
    });
  }

  return payload;
}

module.exports = { buildPayload, questionForClient };
