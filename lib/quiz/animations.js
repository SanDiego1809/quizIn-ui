export const ANIMATIONS = [
  "Being Electrocuted",
  "Breakdance 1990",
  "Drunk Walk",
  "Gangnam Style",
  "Headspin Start",
  "Hip Hop Dancing",
  "Idle",
  "Jazz Dancing",
  "Joyful Jump",
  "Kneeling Pointing",
  "Neutral Idle",
  "Reaction",
  "Rumba Dancing",
  "Spat In Face",
  "Stand To Roll",
  "Standard Walk",
  "Thriller",
  "Walking",
  "Waving",
];

export const DEFAULT_ANIMATION = "Idle";

/** Default celebration clip when a signed-in player has not set one. */
export const DEFAULT_VICTORY_ANIMATION = "Joyful Jump";

/** Clips offered as victory emotes on the profile (excludes plain idle poses). */
export const VICTORY_ANIMATIONS = ANIMATIONS.filter(
  (name) => name !== "Idle" && name !== "Neutral Idle"
);

export const ANIMATION_PREVIEW_MS = 5000;

/** Map legacy clip names to current ones (e.g. renamed assets). */
const ANIMATION_ALIASES = {
  "Thriller Part 3": "Thriller",
};

export function resolveAnimationName(value) {
  if (typeof value !== "string") return null;
  return ANIMATION_ALIASES[value] || value;
}
