const { isTeamsSettings, previewTeams } = require("../../lib/teams");

function getOptionIndex(answer) {
  if (answer == null) return undefined;
  if (typeof answer === "object") return answer.optionIndex;
  return answer;
}

function questionForClient(question) {
  if (!question) return null;
  return {
    id: question.id,
    text: question.text,
    options: question.options,
    imageUrl: question.imageUrl || null,
  };
}

function buildPayload(room, playerId) {
  const state = room.state;
  const inPlay = room.phase === "playing" || room.phase === "reveal";
  const question = state.questions[state.currentQuestionIndex] ?? null;
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

  const payload = {
    scores: state.scores,
    teams,
    yourTeamId,
    currentQuestionIndex: inPlay ? state.currentQuestionIndex : null,
    totalQuestions: state.questions.length || room.settings.questionsPerGame,
    question: inPlay ? questionForClient(question) : null,
    hasAnswered: inPlay ? answersForCurrent[playerId] !== undefined : false,
    answeredPlayerIds: inPlay ? Object.keys(answersForCurrent) : [],
    answeredCount: inPlay ? Object.keys(answersForCurrent).length : 0,
    result: state.result,
    reveal: room.phase === "reveal" ? state.reveal : null,
    eliminatedPlayerIds: state.eliminatedPlayerIds || [],
    buzzLocked: Boolean(state.buzzLocked),
  };

  if (room.phase === "final_results" && state.questions.length) {
    payload.questionReview = state.questions.map((q, index) => {
      const rawAnswers = state.answersByQuestion[index] || {};
      const answers = Object.fromEntries(
        Object.entries(rawAnswers).map(([pid, answer]) => [
          pid,
          getOptionIndex(answer),
        ])
      );
      return {
        id: q.id,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        imageUrl: q.imageUrl || null,
        answers,
      };
    });
  }

  return payload;
}

module.exports = { buildPayload, questionForClient };
