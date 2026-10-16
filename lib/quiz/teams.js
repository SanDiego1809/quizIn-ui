/** Shared client helpers for Blue/Red team pick across quiz modes. */

export const TEAM_IDS = ["blue", "red"];

export function isTeamsVariant(variant) {
  const normalized = String(variant || "")
    .trim()
    .toLowerCase();
  return normalized === "teams" || normalized === "versus";
}

export function sanitizeTeamKey(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return TEAM_IDS.includes(normalized) ? normalized : null;
}
