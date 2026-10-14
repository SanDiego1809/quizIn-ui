const { getPrisma, isDatabaseConfigured } = require("./db");
const { normalizeUnlocked } = require("./cosmetics");
const {
  DEFAULT_ANIMATION,
  DEFAULT_VICTORY_ANIMATION,
} = require("./animations");

async function loadPlayerAccess(userId) {
  if (!userId || !isDatabaseConfigured()) {
    return {
      plan: "free",
      unlockedCosmetics: [],
      skinKey: "default",
      victoryAnimation: DEFAULT_ANIMATION,
      signedIn: false,
    };
  }

  try {
    const prisma = getPrisma();
    const profile = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
      select: {
        plan: true,
        unlockedCosmetics: true,
        skinKey: true,
        avatarKey: true,
      },
    });

    if (!profile) {
      return {
        plan: "free",
        unlockedCosmetics: [],
        skinKey: "default",
        victoryAnimation: DEFAULT_VICTORY_ANIMATION,
        signedIn: true,
      };
    }

    return {
      plan: profile.plan === "premium" ? "premium" : "free",
      unlockedCosmetics: normalizeUnlocked(profile.unlockedCosmetics),
      skinKey: profile.skinKey || "default",
      victoryAnimation: profile.avatarKey || DEFAULT_VICTORY_ANIMATION,
      signedIn: true,
    };
  } catch (err) {
    console.error("[playerAccess] lookup failed", err);
    return {
      plan: "free",
      unlockedCosmetics: [],
      skinKey: "default",
      victoryAnimation: DEFAULT_ANIMATION,
      signedIn: Boolean(userId),
    };
  }
}

async function hydrateSocketAccess(socket) {
  const userId = socket.data?.userId || null;
  const access = await loadPlayerAccess(userId);
  socket.data.plan = access.plan;
  socket.data.unlockedCosmetics = access.unlockedCosmetics;
  socket.data.skinKey = access.skinKey;
  socket.data.victoryAnimation = access.victoryAnimation;
  socket.data.signedIn = access.signedIn;
  return access;
}

function socketAccess(socket) {
  const signedIn = Boolean(socket.data?.userId && socket.data?.signedIn);
  return {
    plan: socket.data?.plan === "premium" ? "premium" : "free",
    unlockedCosmetics: normalizeUnlocked(socket.data?.unlockedCosmetics),
    skinKey: signedIn ? socket.data?.skinKey || "default" : "default",
    victoryAnimation: signedIn
      ? socket.data?.victoryAnimation || DEFAULT_VICTORY_ANIMATION
      : DEFAULT_ANIMATION,
    signedIn,
  };
}

module.exports = {
  loadPlayerAccess,
  hydrateSocketAccess,
  socketAccess,
};
