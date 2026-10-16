import {
  ANIMATIONS,
  DEFAULT_ANIMATION,
  DEFAULT_VICTORY_ANIMATION,
  VICTORY_ANIMATIONS,
  resolveAnimationName,
} from "@/lib/quiz/animations";

/** Only idle poses are free; every emote / dance is Premium or credits. */
export const FREE_ANIMATIONS = ["Idle", "Neutral Idle"];

/** No free victory emotes — all celebration clips are Premium / credits. */
export const FREE_VICTORY_ANIMATIONS = [];

export const PREMIUM_ANIMATIONS = ANIMATIONS.filter(
  (name) => !FREE_ANIMATIONS.includes(name)
);

export const PREMIUM_VICTORY_ANIMATIONS = VICTORY_ANIMATIONS.filter(
  (name) => !FREE_VICTORY_ANIMATIONS.includes(name)
);

/** Base Three.js scale applied to Mixamo FBX roots. */
export const AVATAR_BASE_SCALE = 0.02;

/**
 * Character skins — FBX models under public/assets/animation/skins/.
 * `scale` is a multiplier on AVATAR_BASE_SCALE (Mixamo exports vary a lot).
 */
export const CHARACTER_SKINS = [
  {
    id: "default",
    label: "Y Bot",
    file: "Y Bot",
    useMatcap: true,
    color: null,
    scale: 1,
    free: true,
    creditCost: 0,
  },
  /** Play-to-earn Y Bot tints — Premium does not unlock these. */
  {
    id: "ember",
    label: "Ember",
    file: "Y Bot",
    useMatcap: true,
    color: 0xff6b3d,
    scale: 1,
    free: false,
    earnOnly: true,
    creditCost: 200,
  },
  {
    id: "aurora",
    label: "Aurora",
    file: "Y Bot",
    useMatcap: true,
    color: 0x34d399,
    scale: 1,
    free: false,
    earnOnly: true,
    creditCost: 200,
  },
  {
    id: "gold",
    label: "Gold",
    file: "Y Bot",
    useMatcap: true,
    color: 0xfbbf24,
    scale: 1,
    free: false,
    earnOnly: true,
    creditCost: 350,
  },
  {
    id: "barry",
    label: "Barry",
    file: "Barry",
    useMatcap: false,
    scale: 1,
    free: false,
    earnOnly: false,
    creditCost: 200,
  },
  {
    id: "carlos",
    label: "Carlos",
    file: "Carlos",
    useMatcap: false,
    scale: 1,
    free: false,
    earnOnly: false,
    creditCost: 200,
  },
  {
    id: "elvis",
    label: "Elvis",
    file: "Elvis",
    useMatcap: false,
    scale: 1,
    free: false,
    earnOnly: false,
    creditCost: 200,
  },
  {
    id: "racer",
    label: "Racer",
    file: "Racer",
    useMatcap: false,
    scale: 1,
    free: false,
    earnOnly: false,
    creditCost: 200,
  },
];

export function getSkinScale(skinKey) {
  const skin = getSkin(skinKey);
  const factor = Number(skin?.scale);
  return AVATAR_BASE_SCALE * (Number.isFinite(factor) && factor > 0 ? factor : 1);
}

export const DEFAULT_SKIN = "default";

/** Removed skins → default. */
const SKIN_ALIASES = {
  gordon: "default",
  swat: "default",
};

export function resolveSkinId(skinId) {
  const raw = String(skinId || DEFAULT_SKIN).trim() || DEFAULT_SKIN;
  return SKIN_ALIASES[raw] || raw;
}

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
  const id = resolveSkinId(skinId);
  return (
    CHARACTER_SKINS.find((skin) => skin.id === id) ||
    CHARACTER_SKINS.find((skin) => skin.id === DEFAULT_SKIN)
  );
}

/** Old tint unlocks no longer map to a shop item (those skins are gone). */
const UNLOCKED_SKIN_ALIASES = {};

export function normalizeUnlocked(list) {
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
    skinCatalogId(resolveSkinId(skin.id))
  );
  if (unlocked) return true;
  // Earn-only skins (Ember, Aurora, Gold) require a credit unlock — never Premium.
  if (skin.earnOnly) return false;
  if (isPremiumPlan(plan)) return true;
  return false;
}

export function sanitizeAnimationChoice(
  animationName,
  access = {}
) {
  const resolved = resolveAnimationName(animationName);
  const name = ANIMATIONS.includes(resolved)
    ? resolved
    : DEFAULT_ANIMATION;
  return canUseAnimation(name, access) ? name : DEFAULT_ANIMATION;
}

export function sanitizeVictoryAnimationChoice(animationName, access = {}) {
  let name = resolveAnimationName(animationName);
  if (name === "Idle" || name === "Neutral Idle" || !VICTORY_ANIMATIONS.includes(name)) {
    name = DEFAULT_VICTORY_ANIMATION;
  }
  if (canUseVictoryAnimation(name, access)) return name;
  const freePick = FREE_VICTORY_ANIMATIONS.find((clip) =>
    canUseVictoryAnimation(clip, access)
  );
  // Free plan with no free victory emotes: Idle (not a premium clip).
  return freePick || DEFAULT_ANIMATION;
}

export function sanitizeSkinChoice(skinId, access = {}) {
  const id = resolveSkinId(skinId);
  const known = CHARACTER_SKINS.some((entry) => entry.id === id)
    ? id
    : DEFAULT_SKIN;
  return canUseSkin(known, access) ? known : DEFAULT_SKIN;
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
