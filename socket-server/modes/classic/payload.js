function questionForClient(question) {
  if (!question) return null;
  return {
    id: question.id,
    text: question.text,
    options: question.options,
  };
}

function buildPayload(room, playerId) {
  const state = room.state;
  const question = state.questions[state.currentQuestionIndex] ?? null;
  const answersForCurrent =
    room.phase === "playing"
      ? state.answersByQuestion[state.currentQuestionIndex] || {}
      : {};

  const payload = {
    scores: state.scores,
    currentQuestionIndex:
      room.phase === "playing" ? state.currentQuestionIndex : null,
    totalQuestions: state.questions.length || room.settings.questionsPerGame,
    question: room.phase === "playing" ? questionForClient(question) : null,
    hasAnswered:
      room.phase === "playing" ? answersForCurrent[playerId] !== undefined : false,
    answeredPlayerIds:
      room.phase === "playing" ? Object.keys(answersForCurrent) : [],
    answeredCount:
      room.phase === "playing" ? Object.keys(answersForCurrent).length : 0,
    result: state.result,
  };

  if (room.phase === "final_results" && state.questions.length) {
    payload.questionReview = state.questions.map((q, index) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      answers: state.answersByQuestion[index] || {},
    }));
  }

  return payload;
}

module.exports = { buildPayload, questionForClient };
