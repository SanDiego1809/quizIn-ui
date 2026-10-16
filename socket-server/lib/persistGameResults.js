const { getPrisma, isDatabaseConfigured } = require("./db");

const PLAY_CREDIT_REWARD = 1;
const WIN_CREDIT_BONUS = 3;

async function persistGameResults(room) {
  if (!isDatabaseConfigured() || !room?.state?.result?.rankings) return;

  const prisma = getPrisma();
  const rankings =
    room.state.result.playerRankings ?? room.state.result.rankings;
  const winningTeam = room.state.result.teamRankings?.[0] ?? null;
  const winningTeamPlayerIds = new Set(
    winningTeam?.members?.map((member) => member.playerId) ?? []
  );
  const mode = room.mode || "classic";
  const roomCode = room.code;
  // No credit farming alone — need at least one opponent.
  const awardsCredits = (room.players?.length ?? 0) >= 2;

  const tasks = [];

  for (let index = 0; index < rankings.length; index += 1) {
    const entry = rankings[index];
    const player = room.players.find((p) => p.id === entry.playerId);
    const clerkUserId = player?.userId;
    if (!clerkUserId) continue;

    const rank = index + 1;
    const isWinner = winningTeam
      ? winningTeamPlayerIds.has(entry.playerId)
      : rank === 1;
    const creditDelta = awardsCredits
      ? PLAY_CREDIT_REWARD + (isWinner ? WIN_CREDIT_BONUS : 0)
      : 0;

    tasks.push(
      (async () => {
        const profile = await prisma.userProfile.findUnique({
          where: { clerkUserId },
        });
        if (!profile) return;

        const ops = [
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
                awardsCredits,
              },
            },
          }),
        ];

        if (creditDelta > 0) {
          ops.push(
            prisma.userProfile.update({
              where: { id: profile.id },
              data: { credits: { increment: creditDelta } },
            })
          );
        }

        await prisma.$transaction(ops);
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
