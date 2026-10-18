/** Continent allowlist + labels for geography filters (keep in sync with server). */

export const CONTINENT_IDS = [
  "africa",
  "asia",
  "europe",
  "north_america",
  "south_america",
  "oceania",
];

export const CONTINENT_OPTIONS = [
  { value: "africa", label: "Africa" },
  { value: "asia", label: "Asia" },
  { value: "europe", label: "Europe" },
  { value: "north_america", label: "North America" },
  { value: "south_america", label: "South America" },
  { value: "oceania", label: "Oceania" },
];

export function isContinentId(value) {
  return CONTINENT_IDS.includes(String(value || "").trim().toLowerCase());
}

export function sanitizeContinentList(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const next = [];
  for (const raw of input) {
    const id = String(raw || "").trim().toLowerCase();
    if (!isContinentId(id) || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next;
}
