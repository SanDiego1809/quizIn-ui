const { getPrisma, isDatabaseConfigured } = require("./db");

const PLAY_CREDIT_REWARD = 10;
const WIN_CREDIT_BONUS = 15;

async function persistGameResults(room) {
  if (!isDatabaseConfigured() || !room?.state?.result?.rankings) return;

  const prisma = getPrisma();
  const rankings = room.state.result.rankings;
  const mode = room.mode || "classic";
  const roomCode = room.code;

  const tasks = [];

  for (let index = 0; index < rankings.length; index += 1) {
    const entry = rankings[index];
    const player = room.players.find((p) => p.id === entry.playerId);
    const clerkUserId = player?.userId;
    if (!clerkUserId) continue;

    const rank = index + 1;
    const creditDelta =
      PLAY_CREDIT_REWARD + (rank === 1 ? WIN_CREDIT_BONUS : 0);

    tasks.push(
      (async () => {
        const profile = await prisma.userProfile.findUnique({
          where: { clerkUserId },
        });
        if (!profile) return;

        await prisma.$transaction([
          prisma.gameResult.create({
            data: {
              userId: profile.id,
              mode,
              roomCode,
              score: entry.score || 0,
              rank,
              summary: {
                totalQuestions: room.state.result.totalQuestions ?? null,
                maxScore: room.state.result.maxScore ?? null,
              },
            },
          }),
          prisma.userProfile.update({
            where: { id: profile.id },
            data: { credits: { increment: creditDelta } },
          }),
        ]);
      })()
    );
  }

  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[persistGameResults]", result.reason);
    }
  }
}

module.exports = {
  persistGameResults,
  PLAY_CREDIT_REWARD,
  WIN_CREDIT_BONUS,
};
