import { auth } from "@clerk/nextjs/server";
import { ensureUserProfile } from "@/lib/db/profile";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { isClerkEnabled } from "@/lib/auth/clerk";

const FREE_FAVORITE_LIMIT = 1;

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
  const favorites = await prisma.favorite.findMany({
    where: { userId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    favorites: favorites.map((row) => ({
      id: row.id,
      targetType: row.targetType,
      targetId: row.targetId,
      createdAt: row.createdAt,
    })),
    limit: profile.plan === "premium" ? null : FREE_FAVORITE_LIMIT,
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

  const targetType = String(body.targetType || "").trim().slice(0, 40);
  const targetId = String(body.targetId || "").trim().slice(0, 80);
  if (!targetType || !targetId) {
    return Response.json(
      { error: "targetType and targetId are required." },
      { status: 400 }
    );
  }

  const profile = await ensureUserProfile(userId);

  if (profile.plan !== "premium") {
    const count = await prisma.favorite.count({ where: { userId: profile.id } });
    if (count >= FREE_FAVORITE_LIMIT) {
      return Response.json(
        {
          error: "Favorite limit reached. Upgrade to premium for more.",
          code: "PREMIUM_REQUIRED",
          limit: FREE_FAVORITE_LIMIT,
        },
        { status: 403 }
      );
    }
  }

  const favorite = await prisma.favorite.upsert({
    where: {
      userId_targetType_targetId: {
        userId: profile.id,
        targetType,
        targetId,
      },
    },
    create: {
      userId: profile.id,
      targetType,
      targetId,
    },
    update: {},
  });

  return Response.json({
    favorite: {
      id: favorite.id,
      targetType: favorite.targetType,
      targetId: favorite.targetId,
      createdAt: favorite.createdAt,
    },
  });
}

export async function DELETE(request) {
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

  const { searchParams } = new URL(request.url);
  const targetType = String(searchParams.get("targetType") || "").trim();
  const targetId = String(searchParams.get("targetId") || "").trim();
  if (!targetType || !targetId) {
    return Response.json(
      { error: "targetType and targetId query params are required." },
      { status: 400 }
    );
  }

  const profile = await ensureUserProfile(userId);
  await prisma.favorite.deleteMany({
    where: { userId: profile.id, targetType, targetId },
  });

  return Response.json({ ok: true });
}
