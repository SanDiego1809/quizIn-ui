const ANIMATIONS = [
  "Being Electrocuted",
  "Drunk Walk",
  "Floating",
  "Idle",
  "Joyful Jump",
  "Kneeling Pointing",
  "Low Crawl",
  "Male Dance Pose",
  "Neutral Idle",
  "Reaction",
  "Spat In Face",
  "Stand To Roll",
  "Standard Walk",
  "Swimming",
  "Thriller Part 3",
  "Treading Water",
  "Walking",
  "Waving",
];

const DEFAULT_ANIMATION = "Idle";
const DEFAULT_VICTORY_ANIMATION = "Joyful Jump";
const VICTORY_ANIMATIONS = ANIMATIONS.filter(
  (name) => name !== "Idle" && name !== "Neutral Idle"
);

function sanitizeAnimation(value) {
  if (typeof value !== "string") return DEFAULT_ANIMATION;
  return ANIMATIONS.includes(value) ? value : DEFAULT_ANIMATION;
}

function sanitizeVictoryAnimation(value) {
  if (typeof value !== "string") return DEFAULT_VICTORY_ANIMATION;
  if (VICTORY_ANIMATIONS.includes(value)) return value;
  if (value === "Idle" || value === "Neutral Idle") return DEFAULT_VICTORY_ANIMATION;
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
