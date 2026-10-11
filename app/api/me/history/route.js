import { auth } from "@clerk/nextjs/server";
import { ensureUserProfile } from "@/lib/db/profile";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { isClerkEnabled } from "@/lib/auth/clerk";

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
  const results = await prisma.gameResult.findMany({
    where: { userId: profile.id },
    orderBy: { playedAt: "desc" },
    take: 50,
  });

  return Response.json({
    history: results.map((row) => ({
      id: row.id,
      mode: row.mode,
      roomCode: row.roomCode,
      score: row.score,
      rank: row.rank,
      playedAt: row.playedAt,
      summary: row.summary,
    })),
  });
}
