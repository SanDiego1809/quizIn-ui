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

function sanitizeAnimation(value) {
  if (typeof value !== "string") return DEFAULT_ANIMATION;
  return ANIMATIONS.includes(value) ? value : DEFAULT_ANIMATION;
}

module.exports = {
  ANIMATIONS,
  DEFAULT_ANIMATION,
  sanitizeAnimation,
};
