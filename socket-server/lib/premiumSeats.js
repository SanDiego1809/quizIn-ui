/** Free base seats; each Premium player unlocks +1 up to the hard cap. */
const FREE_SEAT_BASE = 4;
const SEATS_PER_PREMIUM = 1;
const MAX_ROOM_SEATS = 8;

function countPremiumPlayers(players = []) {
  return players.filter((player) => player?.plan === "premium").length;
}

function maxSeatsForPremiumCount(premiumCount) {
  const n = Math.max(0, Number(premiumCount) || 0);
  return Math.min(MAX_ROOM_SEATS, FREE_SEAT_BASE + n * SEATS_PER_PREMIUM);
}

function maxSeatsForPlayers(players = []) {
  return maxSeatsForPremiumCount(countPremiumPlayers(players));
}

function buildSeatInfo(players = []) {
  const premiumCount = countPremiumPlayers(players);
  const max = maxSeatsForPremiumCount(premiumCount);
  return {
    count: players.length,
    max,
    premiumCount,
    freeBase: FREE_SEAT_BASE,
    seatsPerPremium: SEATS_PER_PREMIUM,
    hardCap: MAX_ROOM_SEATS,
    overCapacity: players.length > max,
  };
}

function canAcceptPlayer(players, joinerPlan) {
  const next = [
    ...players,
    { plan: joinerPlan === "premium" ? "premium" : "free" },
  ];
  return next.length <= maxSeatsForPlayers(next);
}

module.exports = {
  FREE_SEAT_BASE,
  SEATS_PER_PREMIUM,
  MAX_ROOM_SEATS,
  countPremiumPlayers,
  maxSeatsForPremiumCount,
  maxSeatsForPlayers,
  buildSeatInfo,
  canAcceptPlayer,
};
