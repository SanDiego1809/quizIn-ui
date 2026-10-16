const ANIMATIONS = [
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

const DEFAULT_ANIMATION = "Idle";
const DEFAULT_VICTORY_ANIMATION = "Joyful Jump";
const VICTORY_ANIMATIONS = ANIMATIONS.filter(
  (name) => name !== "Idle" && name !== "Neutral Idle"
);

/** Map legacy clip names to current ones (e.g. renamed assets). */
const ANIMATION_ALIASES = {
  "Thriller Part 3": "Thriller",
};

function resolveAnimationName(value) {
  if (typeof value !== "string") return null;
  return ANIMATION_ALIASES[value] || value;
}

function sanitizeAnimation(value) {
  const name = resolveAnimationName(value);
  if (!name) return DEFAULT_ANIMATION;
  return ANIMATIONS.includes(name) ? name : DEFAULT_ANIMATION;
}

function sanitizeVictoryAnimation(value) {
  const name = resolveAnimationName(value);
  if (!name) return DEFAULT_VICTORY_ANIMATION;
  if (VICTORY_ANIMATIONS.includes(name)) return name;
  if (name === "Idle" || name === "Neutral Idle") return DEFAULT_VICTORY_ANIMATION;
  return DEFAULT_VICTORY_ANIMATION;
}

module.exports = {
  ANIMATIONS,
  DEFAULT_ANIMATION,
  DEFAULT_VICTORY_ANIMATION,
  VICTORY_ANIMATIONS,
  sanitizeAnimation,
  sanitizeVictoryAnimation,
};
