import { prisma, isDatabaseConfigured } from "./prisma";

const DEFAULT_AVATAR = "Idle";

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

  const patch = {};
  if (data.displayName !== undefined) {
    const name = String(data.displayName || "").trim().slice(0, 30);
    if (!name) throw new Error("Display name is required.");
    patch.displayName = name;
  }
  if (data.avatarKey !== undefined) {
    patch.avatarKey =
      String(data.avatarKey || DEFAULT_AVATAR).trim().slice(0, 40) ||
      DEFAULT_AVATAR;
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
    credits: profile.credits,
    plan: profile.plan,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
