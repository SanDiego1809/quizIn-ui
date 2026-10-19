const fs = require("fs");
const path = require("path");
const { getPrisma, isDatabaseConfigured } = require("./db");
const { notifyQuestionReport } = require("./notifyQuestionReport");

/** Minimum votes before community ratio can leave medium. */
const MIN_VOTES_FOR_TIER = 8;
/** Share of harder/easier votes required to classify hard/easy. */
const TIER_RATE_THRESHOLD = 0.65;

/**
 * questionId → { score, upVotes, downVotes }
 * up = harder, down = easier.
 */
const voteCache = new Map();

const REPORT_LOG = path.join(__dirname, "..", "data", "question-error-reports.jsonl");

let hydratePromise = null;

function emptyVotes() {
  return { score: 0, upVotes: 0, downVotes: 0 };
}

function getVoteEntry(questionId) {
  return voteCache.get(questionId) || emptyVotes();
}

/**
 * Classify from vote counts (Idea B: ratio + minimum sample).
 * Under-sample always returns "medium" for display; callers that need
 * "no community tier yet" should use getCommunityDifficulty.
 */
function votesToDifficulty(upVotes, downVotes) {
  const up = Math.max(0, Number(upVotes) || 0);
  const down = Math.max(0, Number(downVotes) || 0);
  const total = up + down;
  if (total < MIN_VOTES_FOR_TIER) return "medium";
  const hardRate = up / total;
  const easyRate = down / total;
  if (hardRate >= TIER_RATE_THRESHOLD) return "hard";
  if (easyRate >= TIER_RATE_THRESHOLD) return "easy";
  return "medium";
}

/** @deprecated Prefer votesToDifficulty; kept for callers that only have a score. */
function scoreToDifficulty(score, upVotes, downVotes) {
  if (upVotes != null || downVotes != null) {
    return votesToDifficulty(upVotes, downVotes);
  }
  // Legacy net-score path cannot apply Idea B without counts — treat as medium.
  void score;
  return "medium";
}

/**
 * Community tier for quiz filtering.
 * null = never voted or under sample (Classic falls back to author/medium).
 */
function getCommunityDifficulty(questionId) {
  const entry = voteCache.get(questionId);
  if (!entry) return null;
  const total = (entry.upVotes || 0) + (entry.downVotes || 0);
  if (total < MIN_VOTES_FOR_TIER) return null;
  return votesToDifficulty(entry.upVotes, entry.downVotes);
}

function getCommunityScore(questionId) {
  return getVoteEntry(questionId).score;
}

function setVoteCache(questionId, { score, upVotes, downVotes }) {
  voteCache.set(questionId, {
    score: Number(score) || 0,
    upVotes: Math.max(0, Number(upVotes) || 0),
    downVotes: Math.max(0, Number(downVotes) || 0),
  });
}

async function hydrateScoresFromDb() {
  if (!isDatabaseConfigured()) return;
  const prisma = getPrisma();
  const rows = await prisma.questionDifficultyScore.findMany({
    select: { questionId: true, score: true, upVotes: true, downVotes: true },
  });
  for (const row of rows) {
    if ((row.upVotes || 0) + (row.downVotes || 0) > 0 || row.score) {
      setVoteCache(row.questionId, row);
    }
  }
}

function ensureHydrated() {
  if (!hydratePromise) {
    hydratePromise = hydrateScoresFromDb().catch((err) => {
      console.error("[questionFeedback] hydrate failed", err);
      hydratePromise = null;
    });
  }
  return hydratePromise;
}

function appendReportLog(entry) {
  try {
    fs.appendFileSync(REPORT_LOG, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (err) {
    console.error("[questionFeedback] report log failed", err);
  }
}

/**
 * @param {"up"|"down"|"report"} kind
 */
async function submitQuestionFeedback({
  questionId,
  playerKey,
  kind,
  mode = "classic",
  questionText = null,
  options = null,
  correctIndex = null,
  note = null,
}) {
  await ensureHydrated();

  const id = String(questionId || "").trim();
  const key = String(playerKey || "").trim();
  if (!id || !key) {
    return { ok: false, message: "Missing question or player." };
  }

  if (kind === "report") {
    return submitReport({
      questionId: id,
      playerKey: key,
      mode,
      questionText,
      options,
      correctIndex,
      note,
    });
  }

  if (kind !== "up" && kind !== "down") {
    return { ok: false, message: "Unknown feedback kind." };
  }

  const delta = kind === "up" ? 1 : -1;

  if (!isDatabaseConfigured()) {
    const prev = getVoteEntry(id);
    // Without DB, allow sticky in-memory votes (no per-player uniqueness).
    const upAdj = delta === 1 ? 1 : 0;
    const downAdj = delta === -1 ? 1 : 0;
    const next = {
      score: prev.score + delta,
      upVotes: prev.upVotes + upAdj,
      downVotes: prev.downVotes + downAdj,
    };
    setVoteCache(id, next);
    return {
      ok: true,
      kind,
      questionId: id,
      score: next.score,
      upVotes: next.upVotes,
      downVotes: next.downVotes,
      difficulty: votesToDifficulty(next.upVotes, next.downVotes),
      yourVote: delta,
    };
  }

  const prisma = getPrisma();

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.questionDifficultyVote.findUnique({
      where: { questionId_playerKey: { questionId: id, playerKey: key } },
    });

    if (existing?.delta === delta) {
      return {
        scoreRow: await tx.questionDifficultyScore.findUnique({
          where: { questionId: id },
        }),
        yourVote: delta,
        unchanged: true,
      };
    }

    const prevDelta = existing?.delta || 0;
    const scoreDelta = delta - prevDelta;

    if (existing) {
      await tx.questionDifficultyVote.update({
        where: { questionId_playerKey: { questionId: id, playerKey: key } },
        data: { delta },
      });
    } else {
      await tx.questionDifficultyVote.create({
        data: { questionId: id, playerKey: key, delta },
      });
    }

    const upAdj = (delta === 1 ? 1 : 0) - (prevDelta === 1 ? 1 : 0);
    const downAdj = (delta === -1 ? 1 : 0) - (prevDelta === -1 ? 1 : 0);

    const scoreRow = await tx.questionDifficultyScore.upsert({
      where: { questionId: id },
      create: {
        questionId: id,
        score: scoreDelta,
        upVotes: Math.max(0, upAdj),
        downVotes: Math.max(0, downAdj),
      },
      update: {
        score: { increment: scoreDelta },
        upVotes: { increment: upAdj },
        downVotes: { increment: downAdj },
      },
    });

    return { scoreRow, yourVote: delta, unchanged: false };
  });

  const score = result.scoreRow?.score ?? 0;
  const upVotes = result.scoreRow?.upVotes ?? 0;
  const downVotes = result.scoreRow?.downVotes ?? 0;
  setVoteCache(id, { score, upVotes, downVotes });

  return {
    ok: true,
    kind,
    questionId: id,
    score,
    upVotes,
    downVotes,
    difficulty: votesToDifficulty(upVotes, downVotes),
    yourVote: result.yourVote,
    unchanged: Boolean(result.unchanged),
  };
}

async function submitReport({
  questionId,
  playerKey,
  mode,
  questionText,
  options,
  correctIndex,
  note,
}) {
  const cleanNote = note ? String(note).trim().slice(0, 500) : "";
  const entry = {
    questionId,
    playerKey,
    mode,
    questionText,
    note: cleanNote || null,
    options,
    correctIndex,
    at: new Date().toISOString(),
  };
  appendReportLog(entry);

  let unchanged = false;

  if (isDatabaseConfigured()) {
    const prisma = getPrisma();
    try {
      await prisma.questionErrorReport.create({
        data: {
          questionId,
          playerKey,
          mode,
          questionText: questionText
            ? String(questionText).slice(0, 2000)
            : null,
          note: cleanNote || null,
          optionsJson: Array.isArray(options) ? options : undefined,
          correctIndex: Number.isInteger(correctIndex) ? correctIndex : null,
        },
      });
      await prisma.questionDifficultyScore.upsert({
        where: { questionId },
        create: {
          questionId,
          score: 0,
          upVotes: 0,
          downVotes: 0,
          reportCount: 1,
        },
        update: { reportCount: { increment: 1 } },
      });
    } catch (err) {
      if (err?.code === "P2002") {
        unchanged = true;
      } else {
        throw err;
      }
    }
  }

  // Notify even on duplicate clicks only the first time.
  let notify = null;
  if (!unchanged) {
    try {
      notify = await notifyQuestionReport(entry);
    } catch (err) {
      console.error("[questionFeedback] notify failed", err);
    }
  }

  return {
    ok: true,
    kind: "report",
    questionId,
    reported: true,
    unchanged,
    notify,
  };
}

ensureHydrated();

module.exports = {
  submitQuestionFeedback,
  getCommunityDifficulty,
  getCommunityScore,
  votesToDifficulty,
  scoreToDifficulty,
  ensureHydrated,
  MIN_VOTES_FOR_TIER,
  TIER_RATE_THRESHOLD,
};
