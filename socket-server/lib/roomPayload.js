function questionForClient(question) {
  if (!question) return null;
  return {
    id: question.id,
    text: question.text,
    options: question.options,
  };
}

function roomPayloadForPlayer(room, playerId) {
  const question = room.questions[room.currentQuestionIndex] ?? null;
  const answersForCurrent =
    room.phase === "playing"
      ? room.answersByQuestion[room.currentQuestionIndex] || {}
      : {};

  const payload = {
    roomCode: room.code,
    phase: room.phase,
    players: room.players.map(({ id, name, isHost }) => ({ id, name, isHost })),
    hostId: room.hostId,
    settings: room.settings,
    yourPlayerId: playerId,
    scores: room.scores,
    currentQuestionIndex: room.phase === "playing" ? room.currentQuestionIndex : null,
    totalQuestions: room.questions.length || room.settings.questionsPerGame,
    question: room.phase === "playing" ? questionForClient(question) : null,
    hasAnswered:
      room.phase === "playing" ? answersForCurrent[playerId] !== undefined : false,
    answeredCount:
      room.phase === "playing" ? Object.keys(answersForCurrent).length : 0,
    phaseDeadline: room.phaseDeadline,
    result: room.result,
  };

  if (room.phase === "final_results" && room.questions.length) {
    payload.questionReview = room.questions.map((q, index) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      answers: room.answersByQuestion[index] || {},
    }));
  }

  return payload;
}

module.exports = { roomPayloadForPlayer, questionForClient };
