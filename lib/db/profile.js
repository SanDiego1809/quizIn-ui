import { prisma, isDatabaseConfigured } from "./prisma";
import {
  DEFAULT_SKIN,
  canUseVictoryAnimation,
  canUseSkin,
  normalizeUnlocked,
  sanitizeVictoryAnimationChoice,
  sanitizeSkinChoice,
} from "@/lib/quiz/cosmetics";
import { DEFAULT_VICTORY_ANIMATION } from "@/lib/quiz/animations";

const DEFAULT_AVATAR = DEFAULT_VICTORY_ANIMATION;

function accessFromProfile(profile) {
  return {
    plan: profile?.plan === "premium" ? "premium" : "free",
    unlockedCosmetics: normalizeUnlocked(profile?.unlockedCosmetics),
  };
}

export async function ensureUserProfile(clerkUserId, defaults = {}) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured (DATABASE_URL).");
  }
  if (!clerkUserId) {
    throw new Error("Missing clerk user id.");
  }

  const displayName =
    String(defaults.displayName || "").trim().slice(0, 30) || "Player";
  const avatarKey =
    String(defaults.avatarKey || DEFAULT_AVATAR).trim().slice(0, 40) ||
    DEFAULT_AVATAR;

  return prisma.userProfile.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      displayName,
      avatarKey,
      skinKey: DEFAULT_SKIN,
      unlockedCosmetics: [],
    },
    update: {},
  });
}

export async function getProfileByClerkId(clerkUserId) {
  if (!isDatabaseConfigured() || !clerkUserId) return null;
  return prisma.userProfile.findUnique({ where: { clerkUserId } });
}

export async function updateUserProfile(clerkUserId, data) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured (DATABASE_URL).");
  }

  const existing = await prisma.userProfile.findUnique({
    where: { clerkUserId },
  });
  if (!existing) {
    throw new Error("Profile not found.");
  }

  const access = accessFromProfile(existing);
  const patch = {};
  if (data.displayName !== undefined) {
    const name = String(data.displayName || "").trim().slice(0, 30);
    if (!name) throw new Error("Display name is required.");
    patch.displayName = name;
  }
  if (data.avatarKey !== undefined) {
    const nextAvatar = String(data.avatarKey || DEFAULT_AVATAR).trim().slice(0, 40);
    if (!canUseVictoryAnimation(nextAvatar, access)) {
      throw new Error("That victory emote requires Premium or a credit unlock.");
    }
    patch.avatarKey = sanitizeVictoryAnimationChoice(nextAvatar, access);
  }
  if (data.skinKey !== undefined) {
    const nextSkin = String(data.skinKey || DEFAULT_SKIN).trim().slice(0, 40);
    if (!canUseSkin(nextSkin, access)) {
      throw new Error("That skin requires Premium or a credit unlock.");
    }
    patch.skinKey = sanitizeSkinChoice(nextSkin, access);
  }

  return prisma.userProfile.update({
    where: { clerkUserId },
    data: patch,
  });
}

export function serializeProfile(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    displayName: profile.displayName,
    avatarKey: profile.avatarKey,
    skinKey: profile.skinKey || DEFAULT_SKIN,
    unlockedCosmetics: normalizeUnlocked(profile.unlockedCosmetics),
    credits: profile.credits,
    plan: profile.plan,
    hasBilling: Boolean(profile.stripeCustomerId),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
