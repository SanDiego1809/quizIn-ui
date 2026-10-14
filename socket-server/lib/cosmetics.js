const {
  ANIMATIONS,
  DEFAULT_ANIMATION,
  DEFAULT_VICTORY_ANIMATION,
  VICTORY_ANIMATIONS,
  sanitizeVictoryAnimation,
} = require("./animations");

const FREE_ANIMATIONS = [
  "Idle",
  "Neutral Idle",
  "Waving",
  "Walking",
  "Joyful Jump",
  "Reaction",
];

const FREE_VICTORY_ANIMATIONS = [
  "Waving",
  "Joyful Jump",
  "Reaction",
];

const PREMIUM_ANIMATIONS = ANIMATIONS.filter(
  (name) => !FREE_ANIMATIONS.includes(name)
);

const CHARACTER_SKINS = [
  { id: "default", free: true, earnOnly: false },
  { id: "ember", free: false, earnOnly: false },
  { id: "aurora", free: false, earnOnly: false },
  /** Play-to-earn only — Premium does not unlock this skin. */
  { id: "gold", free: false, earnOnly: true },
];

const DEFAULT_SKIN = "default";

function skinCatalogId(skinId) {
  return `skin:${skinId}`;
}

function animationCatalogId(animationName) {
  return `anim:${animationName}`;
}

function normalizeUnlocked(list) {
  if (!Array.isArray(list)) return [];
  return [
    ...new Set(
      list
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 200)
    ),
  ];
}

function isPremiumPlan(plan) {
  return plan === "premium";
}

function canUseAnimation(animationName, { plan, unlockedCosmetics = [] } = {}) {
  const name = ANIMATIONS.includes(animationName)
    ? animationName
    : DEFAULT_ANIMATION;
  if (FREE_ANIMATIONS.includes(name)) return true;
  if (isPremiumPlan(plan)) return true;
  return normalizeUnlocked(unlockedCosmetics).includes(
    animationCatalogId(name)
  );
}

function canUseVictoryAnimation(
  animationName,
  { plan, unlockedCosmetics = [] } = {}
) {
  const name = sanitizeVictoryAnimation(animationName);
  if (FREE_VICTORY_ANIMATIONS.includes(name)) return true;
  if (isPremiumPlan(plan)) return true;
  return normalizeUnlocked(unlockedCosmetics).includes(
    animationCatalogId(name)
  );
}

function canUseSkin(skinId, { plan, unlockedCosmetics = [] } = {}) {
  const skin =
    CHARACTER_SKINS.find((entry) => entry.id === skinId) ||
    CHARACTER_SKINS.find((entry) => entry.id === DEFAULT_SKIN);
  if (!skin) return false;
  if (skin.free) return true;
  const unlocked = normalizeUnlocked(unlockedCosmetics).includes(
    skinCatalogId(skin.id)
  );
  if (unlocked) return true;
  if (skin.earnOnly) return false;
  if (isPremiumPlan(plan)) return true;
  return false;
}

function sanitizeAnimationChoice(animationName, access = {}) {
  const name = ANIMATIONS.includes(animationName)
    ? animationName
    : DEFAULT_ANIMATION;
  return canUseAnimation(name, access) ? name : DEFAULT_ANIMATION;
}

function sanitizeVictoryAnimationChoice(animationName, access = {}) {
  const name = sanitizeVictoryAnimation(animationName);
  if (!canUseVictoryAnimation(name, access)) {
    return DEFAULT_VICTORY_ANIMATION;
  }
  return name;
}

function sanitizeSkinChoice(skinId, access = {}) {
  const id = String(skinId || DEFAULT_SKIN).trim() || DEFAULT_SKIN;
  const known = CHARACTER_SKINS.some((entry) => entry.id === id)
    ? id
    : DEFAULT_SKIN;
  return canUseSkin(known, access) ? known : DEFAULT_SKIN;
}

module.exports = {
  FREE_ANIMATIONS,
  FREE_VICTORY_ANIMATIONS,
  PREMIUM_ANIMATIONS,
  VICTORY_ANIMATIONS,
  CHARACTER_SKINS,
  DEFAULT_SKIN,
  DEFAULT_VICTORY_ANIMATION,
  sanitizeAnimationChoice,
  sanitizeVictoryAnimationChoice,
  sanitizeSkinChoice,
  normalizeUnlocked,
};
