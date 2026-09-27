const VALID_MODES = new Set(["classic", "geography"]);

/** @param {string | null | undefined} value */
export function parsePlayModeParam(value) {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return VALID_MODES.has(normalized) ? normalized : undefined;
}
