const FREE_CLASSIC_MAX_QUESTIONS = 10;
const PREMIUM_CLASSIC_MAX_QUESTIONS = 25;
const FREE_GEOGRAPHY_MAX_QUESTIONS = 8;

function hostIsPremium(room) {
  const host = room?.players?.find((player) => player.id === room.hostId);
  return host?.plan === "premium";
}

module.exports = {
  FREE_CLASSIC_MAX_QUESTIONS,
  PREMIUM_CLASSIC_MAX_QUESTIONS,
  FREE_GEOGRAPHY_MAX_QUESTIONS,
  hostIsPremium,
};
