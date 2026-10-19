import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";

/**
 * List flagged questions for review.
 * Auth: header `x-question-feedback-key` must match QUESTION_FEEDBACK_ADMIN_KEY.
 */
export async function GET(request) {
  const expected = process.env.QUESTION_FEEDBACK_ADMIN_KEY;
  const provided = request.headers.get("x-question-feedback-key");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  const limit = Math.min(
    100,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 50)
  );

  const reports = await prisma.questionErrorReport.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ reports });
}
