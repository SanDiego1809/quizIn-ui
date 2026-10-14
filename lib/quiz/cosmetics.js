import {
  ANIMATIONS,
  DEFAULT_ANIMATION,
  DEFAULT_VICTORY_ANIMATION,
  VICTORY_ANIMATIONS,
} from "@/lib/quiz/animations";

export const FREE_ANIMATIONS = [
  "Idle",
  "Neutral Idle",
  "Waving",
  "Walking",
  "Joyful Jump",
  "Reaction",
];

export const FREE_VICTORY_ANIMATIONS = [
  "Waving",
  "Joyful Jump",
  "Reaction",
];

export const PREMIUM_ANIMATIONS = ANIMATIONS.filter(
  (name) => !FREE_ANIMATIONS.includes(name)
);

export const PREMIUM_VICTORY_ANIMATIONS = VICTORY_ANIMATIONS.filter(
  (name) => !FREE_VICTORY_ANIMATIONS.includes(name)
);

/** Mixamo-style character tint skins (single Y Bot mesh + matcap color). */
export const CHARACTER_SKINS = [
  {
    id: "default",
    label: "Classic Blue",
    color: null,
    free: true,
    creditCost: 0,
  },
  {
    id: "ember",
    label: "Ember",
    color: 0xff6b3d,
    free: false,
    earnOnly: false,
    creditCost: 200,
  },
  {
    id: "aurora",
    label: "Aurora",
    color: 0x34d399,
    free: false,
    earnOnly: false,
    creditCost: 200,
  },
  {
    id: "gold",
    label: "Gold",
    color: 0xfbbf24,
    free: false,
    /** Play-to-earn only — Premium does not unlock this skin. */
    earnOnly: true,
    creditCost: 350,
  },
];

export const DEFAULT_SKIN = "default";

export const ANIMATION_CREDIT_COST = 80;

export function skinCatalogId(skinId) {
  return `skin:${skinId}`;
}

export function animationCatalogId(animationName) {
  return `anim:${animationName}`;
}

export function parseCatalogId(catalogId) {
  const raw = String(catalogId || "");
  const sep = raw.indexOf(":");
  if (sep <= 0) return null;
  const kind = raw.slice(0, sep);
  const id = raw.slice(sep + 1);
  if (!id) return null;
  if (kind === "skin") return { kind, id };
  if (kind === "anim") return { kind, id };
  return null;
}

export function getSkin(skinId) {
  return (
    CHARACTER_SKINS.find((skin) => skin.id === skinId) ||
    CHARACTER_SKINS.find((skin) => skin.id === DEFAULT_SKIN)
  );
}

export function normalizeUnlocked(list) {
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

export function isPremiumPlan(plan) {
  return plan === "premium";
}

export function canUseAnimation(animationName, { plan, unlockedCosmetics = [] } = {}) {
  const name = ANIMATIONS.includes(animationName)
    ? animationName
    : DEFAULT_ANIMATION;
  if (FREE_ANIMATIONS.includes(name)) return true;
  if (isPremiumPlan(plan)) return true;
  return normalizeUnlocked(unlockedCosmetics).includes(
    animationCatalogId(name)
  );
}

export function canUseVictoryAnimation(
  animationName,
  { plan, unlockedCosmetics = [] } = {}
) {
  const name = VICTORY_ANIMATIONS.includes(animationName)
    ? animationName
    : DEFAULT_VICTORY_ANIMATION;
  if (FREE_VICTORY_ANIMATIONS.includes(name)) return true;
  if (isPremiumPlan(plan)) return true;
  return normalizeUnlocked(unlockedCosmetics).includes(
    animationCatalogId(name)
  );
}

export function canUseSkin(skinId, { plan, unlockedCosmetics = [] } = {}) {
  const skin = getSkin(skinId);
  if (!skin) return false;
  if (skin.free) return true;
  const unlocked = normalizeUnlocked(unlockedCosmetics).includes(
    skinCatalogId(skin.id)
  );
  if (unlocked) return true;
  // Earn-only skins (e.g. Gold) require a credit unlock — never Premium.
  if (skin.earnOnly) return false;
  if (isPremiumPlan(plan)) return true;
  return false;
}

export function sanitizeAnimationChoice(
  animationName,
  access = {}
) {
  const name = ANIMATIONS.includes(animationName)
    ? animationName
    : DEFAULT_ANIMATION;
  return canUseAnimation(name, access) ? name : DEFAULT_ANIMATION;
}

export function sanitizeVictoryAnimationChoice(animationName, access = {}) {
  let name = animationName;
  if (name === "Idle" || name === "Neutral Idle" || !VICTORY_ANIMATIONS.includes(name)) {
    name = DEFAULT_VICTORY_ANIMATION;
  }
  return canUseVictoryAnimation(name, access)
    ? name
    : DEFAULT_VICTORY_ANIMATION;
}

export function sanitizeSkinChoice(skinId, access = {}) {
  const id = String(skinId || DEFAULT_SKIN).trim() || DEFAULT_SKIN;
  return canUseSkin(id, access) ? getSkin(id).id : DEFAULT_SKIN;
}

export function catalogEntry(catalogId) {
  const parsed = parseCatalogId(catalogId);
  if (!parsed) return null;
  if (parsed.kind === "skin") {
    const skin = CHARACTER_SKINS.find((entry) => entry.id === parsed.id);
    if (!skin || skin.free) return null;
    return {
      catalogId: skinCatalogId(skin.id),
      kind: "skin",
      id: skin.id,
      label: skin.label,
      creditCost: skin.creditCost,
      earnOnly: Boolean(skin.earnOnly),
    };
  }
  if (parsed.kind === "anim") {
    if (!PREMIUM_VICTORY_ANIMATIONS.includes(parsed.id)) return null;
    return {
      catalogId: animationCatalogId(parsed.id),
      kind: "anim",
      id: parsed.id,
      label: parsed.id,
      creditCost: ANIMATION_CREDIT_COST,
    };
  }
  return null;
}

export function listShopItems() {
  const skins = CHARACTER_SKINS.filter((skin) => !skin.free).map((skin) => ({
    catalogId: skinCatalogId(skin.id),
    kind: "skin",
    id: skin.id,
    label: skin.label,
    creditCost: skin.creditCost,
    earnOnly: Boolean(skin.earnOnly),
  }));
  const anims = PREMIUM_VICTORY_ANIMATIONS.map((name) => ({
    catalogId: animationCatalogId(name),
    kind: "anim",
    id: name,
    label: name,
    creditCost: ANIMATION_CREDIT_COST,
    earnOnly: false,
  }));
  return [...skins, ...anims];
}

/** Items a player still needs to buy with credits (Premium skips non–earn-only). */
export function listPurchasableShopItems({
  plan,
  unlockedCosmetics = [],
} = {}) {
  const unlocked = new Set(normalizeUnlocked(unlockedCosmetics));
  const premium = isPremiumPlan(plan);
  return listShopItems().filter((item) => {
    if (unlocked.has(item.catalogId)) return false;
    if (premium && !item.earnOnly) return false;
    return true;
  });
}
