import { auth } from "@clerk/nextjs/server";
import {
  ensureUserProfile,
  serializeProfile,
} from "@/lib/db/profile";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { isClerkEnabled } from "@/lib/auth/clerk";
import {
  catalogEntry,
  listPurchasableShopItems,
  listShopItems,
  normalizeUnlocked,
} from "@/lib/quiz/cosmetics";

export async function GET() {
  if (!isClerkEnabled()) {
    return Response.json({ error: "Auth is not configured." }, { status: 503 });
  }
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await ensureUserProfile(userId);
  const unlockedCosmetics = normalizeUnlocked(profile.unlockedCosmetics);
  return Response.json({
    shop: listShopItems(),
    purchasable: listPurchasableShopItems({
      plan: profile.plan,
      unlockedCosmetics,
    }),
    unlockedCosmetics,
    credits: profile.credits,
    plan: profile.plan,
  });
}

export async function POST(request) {
  if (!isClerkEnabled()) {
    return Response.json({ error: "Auth is not configured." }, { status: 503 });
  }
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const entry = catalogEntry(body.catalogId);
  if (!entry) {
    return Response.json(
      { error: "Unknown or free cosmetic — nothing to unlock." },
      { status: 400 }
    );
  }

  const profile = await ensureUserProfile(userId);
  const unlocked = normalizeUnlocked(profile.unlockedCosmetics);
  if (unlocked.includes(entry.catalogId)) {
    return Response.json({
      profile: serializeProfile(profile),
      alreadyOwned: true,
    });
  }

  // Premium includes non–earn-only cosmetics; earn-only (Gold) still needs credits.
  if (profile.plan === "premium" && !entry.earnOnly) {
    return Response.json(
      {
        error: "Premium already includes this cosmetic.",
        code: "PREMIUM_INCLUDES",
      },
      { status: 400 }
    );
  }

  if (profile.credits < entry.creditCost) {
    return Response.json(
      {
        error: `Need ${entry.creditCost} credits (you have ${profile.credits}).`,
        code: "INSUFFICIENT_CREDITS",
      },
      { status: 402 }
    );
  }

  const updated = await prisma.userProfile.update({
    where: { clerkUserId: userId },
    data: {
      credits: { decrement: entry.creditCost },
      unlockedCosmetics: [...unlocked, entry.catalogId],
    },
  });

  return Response.json({
    profile: serializeProfile(updated),
    unlocked: entry,
  });
}
