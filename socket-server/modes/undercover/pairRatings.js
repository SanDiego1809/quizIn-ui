/**
 * In-memory aggregation of Undercover word-pair ratings.
 * Not persisted across process restarts.
 */

const ratingsByPairId = new Map();

function normalizeRating(raw) {
  if (raw === "up" || raw === "thumb_up" || raw === "👍") return 5;
  if (raw === "down" || raw === "thumb_down" || raw === "👎") return 1;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

function recordPairRating(pairId, playerId, rawRating) {
  const id = String(pairId || "").trim();
  const pid = String(playerId || "").trim();
  if (!id || !pid) {
    return { ok: false, message: "Missing pair or player." };
  }
  const rating = normalizeRating(rawRating);
  if (rating == null) {
    return { ok: false, message: "Rating must be 1–5 or thumbs up/down." };
  }

  let entry = ratingsByPairId.get(id);
  if (!entry) {
    entry = { byPlayer: new Map(), sum: 0, count: 0 };
    ratingsByPairId.set(id, entry);
  }

  const prev = entry.byPlayer.get(pid);
  if (prev != null) {
    entry.sum -= prev;
    entry.count -= 1;
  }
  entry.byPlayer.set(pid, rating);
  entry.sum += rating;
  entry.count += 1;

  return { ok: true, summary: getPairRatingSummary(id) };
}

function getPairRatingSummary(pairId) {
  const entry = ratingsByPairId.get(String(pairId || ""));
  if (!entry || entry.count === 0) {
    return { pairId, count: 0, average: null };
  }
  return {
    pairId,
    count: entry.count,
    average: Math.round((entry.sum / entry.count) * 100) / 100,
  };
}

function getAllPairRatings() {
  const out = {};
  for (const pairId of ratingsByPairId.keys()) {
    out[pairId] = getPairRatingSummary(pairId);
  }
  return out;
}

module.exports = {
  recordPairRating,
  getPairRatingSummary,
  getAllPairRatings,
  normalizeRating,
};
