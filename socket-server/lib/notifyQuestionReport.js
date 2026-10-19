/**
 * Email notifications when a question is flagged (Web3Forms — free).
 * Set WEB3FORMS_ACCESS_KEY (inbox = email used when creating the key).
 * Optional: REPORT_NOTIFY_EMAIL (form “from” field; not the inbox target).
 */

async function notifyQuestionReport(report) {
  const results = { email: null };

  const web3Key = process.env.WEB3FORMS_ACCESS_KEY;
  if (!web3Key) {
    return results;
  }

  const lines = [
    "QuizIn — question error report",
    `Mode: ${report.mode || "classic"}`,
    `Question id: ${report.questionId}`,
    `Text: ${report.questionText || "(none)"}`,
    `Note: ${report.note || "(no note)"}`,
    `Player: ${report.playerKey || "?"}`,
    `When: ${report.at || new Date().toISOString()}`,
  ];
  if (Array.isArray(report.options) && report.options.length) {
    lines.push(
      `Options: ${report.options.map((o, i) => `${i}:${o}`).join(" | ")}`
    );
    if (report.correctIndex != null) {
      lines.push(`Marked correct index: ${report.correctIndex}`);
    }
  }

  try {
    const body = {
      access_key: web3Key,
      subject: `[QuizIn] Question report: ${report.questionId}`,
      from_name: "QuizIn reports",
      message: lines.join("\n"),
      email: process.env.REPORT_NOTIFY_EMAIL || "reports@quizin.app",
    };
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    results.email = res.ok ? "sent" : `failed:${res.status}`;
  } catch (err) {
    console.error("[notifyQuestionReport] email failed", err);
    results.email = "error";
  }

  return results;
}

module.exports = { notifyQuestionReport };
