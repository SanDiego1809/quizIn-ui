const {
  ANIMATIONS,
  DEFAULT_ANIMATION,
  DEFAULT_VICTORY_ANIMATION,
  VICTORY_ANIMATIONS,
  sanitizeVictoryAnimation,
} = require("./animations");

/** Only idle poses are free; every emote / dance is Premium or credits. */
const FREE_ANIMATIONS = ["Idle", "Neutral Idle"];

/** No free victory emotes — all celebration clips are Premium / credits. */
const FREE_VICTORY_ANIMATIONS = [];

const PREMIUM_ANIMATIONS = ANIMATIONS.filter(
  (name) => !FREE_ANIMATIONS.includes(name)
);

const CHARACTER_SKINS = [
  { id: "default", free: true, earnOnly: false },
  /** Play-to-earn Y Bot tints — Premium does not unlock these. */
  { id: "ember", free: false, earnOnly: true },
  { id: "aurora", free: false, earnOnly: true },
  { id: "gold", free: false, earnOnly: true },
  { id: "barry", free: false, earnOnly: false },
  { id: "carlos", free: false, earnOnly: false },
  { id: "elvis", free: false, earnOnly: false },
  { id: "racer", free: false, earnOnly: false },
];

const DEFAULT_SKIN = "default";

/** Removed skins → default. */
const SKIN_ALIASES = {
  gordon: "default",
  swat: "default",
};

function resolveSkinId(skinId) {
  const raw = String(skinId || DEFAULT_SKIN).trim() || DEFAULT_SKIN;
  return SKIN_ALIASES[raw] || raw;
}

function skinCatalogId(skinId) {
  return `skin:${skinId}`;
}

function animationCatalogId(animationName) {
  return `anim:${animationName}`;
}

/** Old tint unlocks no longer map to a shop item (those skins are gone). */
const UNLOCKED_SKIN_ALIASES = {};

function normalizeUnlocked(list) {
  if (!Array.isArray(list)) return [];
  return [
    ...new Set(
      list
        .map((item) => {
          const raw = String(item || "").trim();
          return UNLOCKED_SKIN_ALIASES[raw] || raw;
        })
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
  const id = resolveSkinId(skinId);
  const skin =
    CHARACTER_SKINS.find((entry) => entry.id === id) ||
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
  if (canUseVictoryAnimation(name, access)) return name;
  const freePick = FREE_VICTORY_ANIMATIONS.find((clip) =>
    canUseVictoryAnimation(clip, access)
  );
  // Free plan with no free victory emotes: Idle (not a premium clip).
  return freePick || DEFAULT_ANIMATION;
}

function sanitizeSkinChoice(skinId, access = {}) {
  const id = resolveSkinId(skinId);
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
