/** Free base seats; each Premium player unlocks +1 up to the hard cap. */
export const FREE_SEAT_BASE = 4;
export const SEATS_PER_PREMIUM = 1;
export const MAX_ROOM_SEATS = 8;

export function countPremiumPlayers(players = []) {
  return players.filter((player) => player?.plan === "premium").length;
}

export function maxSeatsForPremiumCount(premiumCount) {
  const n = Math.max(0, Number(premiumCount) || 0);
  return Math.min(MAX_ROOM_SEATS, FREE_SEAT_BASE + n * SEATS_PER_PREMIUM);
}

export function maxSeatsForPlayers(players = []) {
  return maxSeatsForPremiumCount(countPremiumPlayers(players));
}

export function buildSeatInfo(players = []) {
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

export function canAcceptPlayer(players, joinerPlan) {
  const next = [...players, { plan: joinerPlan === "premium" ? "premium" : "free" }];
  return next.length <= maxSeatsForPlayers(next);
}
