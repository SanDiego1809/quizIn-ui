export const ANIMATIONS = [
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

export const DEFAULT_ANIMATION = "Idle";

/** Default celebration clip when a signed-in player has not set one. */
export const DEFAULT_VICTORY_ANIMATION = "Joyful Jump";

/** Clips offered as victory emotes on the profile (excludes plain idle poses). */
export const VICTORY_ANIMATIONS = ANIMATIONS.filter(
  (name) => name !== "Idle" && name !== "Neutral Idle"
);

export const ANIMATION_PREVIEW_MS = 5000;
