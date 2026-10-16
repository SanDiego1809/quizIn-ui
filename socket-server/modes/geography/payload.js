const {
  findCountryByCode,
} = require("./logic");
const { isTeamsSettings, previewTeams } = require("../../lib/teams");

function questionForClient(country, settings = {}) {
  if (!country) return null;
  const variant = String(settings.variant || "countries").toLowerCase();
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
  const answersForCurrent =
    room.phase === "playing"
      ? state.answersByQuestion[state.currentQuestionIndex] || {}
      : {};

  const teams =
    room.phase === "playing" || room.phase === "final_results"
      ? state.teams
      : isTeamsSettings(room.settings)
        ? previewTeams(room.players)
        : null;

  const yourTeamId =
    teams?.find((team) => team.playerIds.includes(playerId))?.id ?? null;

  const payload = {
    scores: state.scores,
    teams,
    yourTeamId,
    currentQuestionIndex:
      room.phase === "playing" ? state.currentQuestionIndex : null,
    totalQuestions: state.countries.length || room.settings.questionsPerGame,
    question:
      room.phase === "playing"
        ? questionForClient(country, room.settings)
        : null,
    hasAnswered:
      room.phase === "playing"
        ? answersForCurrent[playerId] !== undefined
        : false,
    answeredPlayerIds:
      room.phase === "playing" ? Object.keys(answersForCurrent) : [],
    answeredCount:
      room.phase === "playing" ? Object.keys(answersForCurrent).length : 0,
    result: state.result,
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
        answers,
      };
    });
  }

  return payload;
}

module.exports = { buildPayload, questionForClient };
