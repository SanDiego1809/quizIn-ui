const { findCountryByCode } = require("./logic");

function questionForClient(country) {
  if (!country) return null;
  return {
    id: country.id,
    countryName: country.countryName,
  };
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

  const payload = {
    scores: state.scores,
    currentQuestionIndex:
      room.phase === "playing" ? state.currentQuestionIndex : null,
    totalQuestions: state.countries.length || room.settings.questionsPerGame,
    question: room.phase === "playing" ? questionForClient(country) : null,
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
    payload.questionReview = state.countries.map((country, index) => {
      const rawAnswers = state.answersByQuestion[index] || {};
      const answers = Object.fromEntries(
        Object.entries(rawAnswers)
          .filter(([, answer]) => answer && answer.countryCode)
          .map(([pid, answer]) => [pid, resolveAnswerLabel(answer.countryCode)])
      );
      return {
        id: country.id,
        countryName: country.countryName,
        correctCode: country.countryCode,
        answers,
      };
    });
  }

  return payload;
}

module.exports = { buildPayload, questionForClient };
