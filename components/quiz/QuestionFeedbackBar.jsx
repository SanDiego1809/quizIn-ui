"use client";

import { useEffect, useState } from "react";
import classes from "./QuestionFeedbackBar.module.css";

export default function QuestionFeedbackBar({
  questionId,
  disabled = false,
  onFeedback,
  labels = {},
}) {
  const [yourVote, setYourVote] = useState(null);
  const [reported, setReported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    setYourVote(null);
    setReported(false);
    setStatus("");
    setReportOpen(false);
    setNote("");
  }, [questionId]);

  const send = async (kind, extra = {}) => {
    if (!onFeedback || disabled || busy || !questionId) return;
    if (kind === "report" && reported) return;
    setBusy(true);
    setStatus("");
    try {
      const result = await onFeedback(kind, extra);
      if (!result?.ok) {
        setStatus(result?.message || labels.error || "Could not save.");
        return;
      }
      if (kind === "report") {
        setReported(true);
        setReportOpen(false);
        setNote("");
        setStatus(labels.reported || "Thanks — flagged for review.");
      } else {
        setYourVote(result.yourVote ?? (kind === "up" ? 1 : -1));
        setStatus(
          kind === "up"
            ? labels.votedHarder || "Marked hard"
            : labels.votedEasier || "Marked easy"
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={classes.bar} role="group" aria-label={labels.group || "Question feedback"}>
      <span className={classes.caption}>
        {labels.caption || "Rate difficulty"}
      </span>
      <div className={classes.buttons}>
        <button
          type="button"
          className={`${classes.btn} ${classes.up} ${
            yourVote === 1 ? classes.active : ""
          }`}
          disabled={disabled || busy}
          aria-pressed={yourVote === 1}
          title={labels.upTitle || "Hard"}
          onClick={() => send("up")}
        >
          <span aria-hidden="true">▲</span>
          <span className={classes.btnLabel}>{labels.up || "Hard"}</span>
        </button>
        <button
          type="button"
          className={`${classes.btn} ${classes.down} ${
            yourVote === -1 ? classes.active : ""
          }`}
          disabled={disabled || busy}
          aria-pressed={yourVote === -1}
          title={labels.downTitle || "Easy"}
          onClick={() => send("down")}
        >
          <span aria-hidden="true">▼</span>
          <span className={classes.btnLabel}>{labels.down || "Easy"}</span>
        </button>
        <button
          type="button"
          className={`${classes.btn} ${classes.report} ${
            reported ? classes.reportDone : ""
          }`}
          disabled={disabled || busy || reported}
          aria-pressed={reported || reportOpen}
          title={labels.reportTitle || "Report error"}
          onClick={() => {
            if (reported) return;
            setReportOpen((open) => !open);
          }}
        >
          <span className={classes.dangerIcon} aria-hidden="true">
            ⚠
          </span>
          <span className={classes.btnLabel}>
            {reported
              ? labels.reportedShort || "Reported"
              : labels.report || "Report"}
          </span>
        </button>
      </div>

      {reportOpen && !reported ? (
        <div className={classes.noteBox}>
          <label className={classes.noteLabel} htmlFor={`q-note-${questionId}`}>
            {labels.noteLabel || "Optional note (what’s wrong?)"}
          </label>
          <textarea
            id={`q-note-${questionId}`}
            className={classes.noteInput}
            maxLength={500}
            rows={2}
            value={note}
            disabled={busy}
            placeholder={
              labels.notePlaceholder || "e.g. Wrong answer, typo, unclear…"
            }
            onChange={(e) => setNote(e.target.value)}
          />
          <div className={classes.noteActions}>
            <button
              type="button"
              className={`${classes.btn} ${classes.report}`}
              disabled={busy}
              onClick={() => send("report", { note })}
            >
              {labels.sendReport || "Send report"}
            </button>
            <button
              type="button"
              className={classes.btn}
              disabled={busy}
              onClick={() => {
                setReportOpen(false);
                setNote("");
              }}
            >
              {labels.cancel || "Cancel"}
            </button>
          </div>
        </div>
      ) : null}

      {status ? <p className={classes.status}>{status}</p> : null}
    </div>
  );
}
