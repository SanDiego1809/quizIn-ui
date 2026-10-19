"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { DEFAULT_SKIN } from "@/lib/quiz/cosmetics";
import { animationForAnswerOutcome } from "@/lib/quiz/revealAnimations";
import { playQuizSfx } from "@/lib/quiz/quizSfx";
import { isTeamsVariant } from "@/lib/quiz/teams";
import { getTranslations } from "@/lib/i18n";
import LiveRanking from "@/components/quiz/LiveRanking";
import QuestionFeedbackBar from "@/components/quiz/QuestionFeedbackBar";
import classes from "./QuizQuestion.module.css";
import Button from "@/components/button/Button";

const QuizAvatarRoom = dynamic(
  () => import("@/components/avatar/QuizAvatarRoom"),
  { ssr: false }
);

const BUZZER_COLORS = ["amber", "sky", "rose", "violet"];

function formatCountdown(deadline) {
  if (!deadline) return null;
  const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  return `${seconds}s`;
}

export default function QuizQuestion({
  room,
  onSubmit,
  onAdvance,
  onQuestionFeedback,
  isHost = false,
  lang = "en",
  variant = "default",
  onSceneReady,
}) {
  const [countdown, setCountdown] = useState(null);
  const [pressedIndex, setPressedIndex] = useState(null);
  const questionNumber = (room.currentQuestionIndex ?? 0) + 1;
  const t = getTranslations(lang);
  const teamsMode = isTeamsVariant(room.settings?.variant);
  const yourTeam = room.teams?.find((team) => team.id === room.yourTeamId);
  const classicShow = variant === "classicShow";
  const isReveal = room.phase === "reveal";
  const audioPack = Boolean(room.settings?.audioPack);
  const hostPacing = Boolean(room.settings?.hostPacing);
  const eliminated = useMemo(
    () => new Set(room.eliminatedPlayerIds || []),
    [room.eliminatedPlayerIds]
  );
  const youEliminated = eliminated.has(room.yourPlayerId);
  const revealCorrect =
    isReveal && room.reveal?.correctIndex != null
      ? room.reveal.correctIndex
      : null;
  const prevPhaseRef = useRef(room.phase);
  const prevAnsweredRef = useRef(room.hasAnswered);

  const scenePlayers = useMemo(() => {
    const answeredSet = new Set(room.answeredPlayerIds ?? []);
    const pointsByPlayer = room.reveal?.pointsByPlayer || {};
    return room.players.map((player) => {
      const answered = answeredSet.has(player.id);
      let answerOutcome = answered ? "pending" : "idle";
      if (isReveal) {
        if (!answered) answerOutcome = "missed";
        else if (pointsByPlayer[player.id]) answerOutcome = "correct";
        else answerOutcome = "wrong";
      }
      return {
        id: player.id,
        name: player.name,
        animation: animationForAnswerOutcome(answerOutcome),
        skinKey: player.skinKey ?? DEFAULT_SKIN,
        answered,
        answerOutcome,
      };
    });
  }, [
    room.players,
    room.answeredPlayerIds,
    room.reveal?.pointsByPlayer,
    isReveal,
  ]);

  useEffect(() => {
    setPressedIndex(null);
  }, [room.currentQuestionIndex, room.phase]);

  useEffect(() => {
    if (!room.phaseDeadline || isReveal) {
      setCountdown(null);
      return undefined;
    }

    const tick = () => {
      const label = formatCountdown(room.phaseDeadline);
      setCountdown(label);
      if (audioPack && label === "3s") {
        playQuizSfx("tick", true);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [room.phaseDeadline, isReveal, audioPack]);

  useEffect(() => {
    if (room.hasAnswered && !prevAnsweredRef.current) {
      playQuizSfx("lock", audioPack);
    }
    prevAnsweredRef.current = room.hasAnswered;
  }, [room.hasAnswered, audioPack]);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = room.phase;
    if (room.phase !== "reveal" || prev === "reveal") return;
    const points = room.reveal?.pointsByPlayer?.[room.yourPlayerId];
    if (points) playQuizSfx("correct", audioPack);
    else if (room.hasAnswered) playQuizSfx("wrong", audioPack);
  }, [
    room.phase,
    room.reveal?.pointsByPlayer,
    room.yourPlayerId,
    room.hasAnswered,
    audioPack,
  ]);

  const handlePick = (index) => {
    if (room.hasAnswered || isReveal || youEliminated) return;
    setPressedIndex(index);
    onSubmit(index);
  };

  const rankingLabel =
    t.geoQuestion?.liveRanking ?? t.play?.liveRanking ?? "Ranking";
  const youLabel = t.geoQuestion?.youTag ?? t.results?.youTag ?? "you";
  const questionImage = room.question?.imageUrl || null;
  const canBuzz =
    !room.hasAnswered && !isReveal && !youEliminated && !room.buzzLocked;

  return (
    <section
      className={`${classes.stage} ${classicShow ? classes.classicShow : ""}`}
    >
      {classicShow ? (
        <LiveRanking
          players={room.players}
          scores={room.scores || {}}
          yourPlayerId={room.yourPlayerId}
          eliminatedPlayerIds={room.eliminatedPlayerIds || []}
          phase={isReveal ? "reveal" : "playing"}
          label={rankingLabel}
          youLabel={youLabel}
          variant="classic"
          showEliminated={Boolean(room.settings?.scoringMode === "sudden_death")}
        />
      ) : null}

      <div className={classes.sceneArea}>
        <div className={classes.room}>
          <QuizAvatarRoom
            players={scenePlayers}
            yourPlayerId={room.yourPlayerId}
            className={classes.roomCanvas}
            backdrop={classicShow ? "stage" : "studio"}
            showLoadingOverlay={!classicShow}
            onReady={classicShow ? onSceneReady : undefined}
            pulpitKit={room.settings?.pulpitKit || "gold"}
          />
        </div>
      </div>

      <footer
        className={`${classes.questionBar} ${classicShow ? classes.questionBarChrome : ""}`}
      >
        <header className={`${classes.header} ${classes.headerLowerThird}`}>
          <span className={classes.progress}>
            {(t.play?.questionProgress ?? "Question {n} / {total}")
              .replace("{n}", String(questionNumber))
              .replace("{total}", String(room.totalQuestions))}
          </span>
          {countdown ? <span className={classes.timer}>{countdown}</span> : null}
          {isReveal ? (
            <span className={classes.revealBadge}>
              {t.play?.revealBeat ?? "Scores updating…"}
            </span>
          ) : null}
        </header>

        {teamsMode && yourTeam ? (
          <p
            className={`${classes.teamBanner} ${
              yourTeam.id === "red"
                ? classes.teamBannerRed
                : classes.teamBannerBlue
            }`}
          >
            {(
              t.geoQuestion?.yourTeam ??
              t.settings?.pickYourTeam ??
              "Your team: {team}"
            ).replace(
              "{team}",
              yourTeam.id === "red"
                ? t.results?.teamRed ?? t.settings?.teamRed ?? "Red"
                : t.results?.teamBlue ?? t.settings?.teamBlue ?? "Blue"
            )}
          </p>
        ) : null}

        {questionImage ? (
          <div className={classes.pictureFrame}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={questionImage}
              alt=""
              className={classes.pictureImage}
            />
          </div>
        ) : null}

        <h2 className={classes.question}>{room.question?.text}</h2>

        {room.question?.id && onQuestionFeedback ? (
          <QuestionFeedbackBar
            questionId={room.question.id}
            onFeedback={(kind, extra = {}) =>
              onQuestionFeedback({
                questionId: room.question.id,
                kind,
                note: extra.note,
              })
            }
            labels={{
              caption: t.play?.feedbackCaption ?? "Rate this question",
              up: t.play?.feedbackHarder ?? "Hard",
              down: t.play?.feedbackEasier ?? "Easy",
              report: t.play?.feedbackReport ?? "Report error",
              reported: t.play?.feedbackReported ?? "Thanks — flagged for review.",
              reportedShort: t.play?.feedbackReportedShort ?? "Reported",
              votedHarder: t.play?.feedbackVotedHarder ?? "Marked hard",
              votedEasier: t.play?.feedbackVotedEasier ?? "Marked easy",
              error: t.play?.feedbackError ?? "Could not save.",
              upTitle: t.play?.feedbackHarderTitle ?? "This question is hard",
              downTitle: t.play?.feedbackEasierTitle ?? "This question is easy",
              reportTitle:
                t.play?.feedbackReportTitle ?? "Report a wrong or broken question",
              noteLabel: t.play?.feedbackNoteLabel ?? "Optional note (what’s wrong?)",
              notePlaceholder:
                t.play?.feedbackNotePlaceholder ??
                "e.g. Wrong answer, typo, unclear…",
              sendReport: t.play?.feedbackSendReport ?? "Send report",
              cancel: t.play?.feedbackCancel ?? "Cancel",
            }}
          />
        ) : null}

        {classicShow ? (
          <div className={classes.buzzerGrid}>
            {(room.question?.options ?? []).map((option, index) => {
              const color = BUZZER_COLORS[index % BUZZER_COLORS.length];
              const isPressed =
                pressedIndex === index ||
                (room.hasAnswered && pressedIndex === index);
              const isCorrect = revealCorrect === index;
              const isWrongPick =
                isReveal &&
                room.hasAnswered &&
                pressedIndex === index &&
                revealCorrect != null &&
                revealCorrect !== index;
              return (
                <button
                  key={`${room.question.id}-${index}`}
                  type="button"
                  className={[
                    classes.buzzer,
                    classes[`buzzer_${color}`],
                    isPressed ? classes.buzzerPressed : "",
                    isCorrect ? classes.buzzerCorrect : "",
                    isWrongPick ? classes.buzzerWrong : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={!canBuzz}
                  onClick={() => handlePick(index)}
                >
                  <span className={classes.buzzerKey}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={classes.buzzerText}>{option}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className={classes.options}>
            {room.question?.options.map((option, index) => (
              <Button
                key={`${room.question.id}-${index}`}
                className={classes.option}
                variant="secondary"
                disabled={!canBuzz}
                onClick={() => onSubmit(index)}
              >
                {option}
              </Button>
            ))}
          </div>
        )}

        {youEliminated && !isReveal ? (
          <p className={classes.hint}>
            {t.play?.eliminatedHint ??
              "You’re out for this round (sudden death)."}
          </p>
        ) : null}

        {room.buzzLocked && !isReveal ? (
          <p className={classes.hint}>
            {t.play?.buzzerLockedHint ??
              "Someone locked in the correct answer — buzzers are closed."}
          </p>
        ) : null}

        {room.hasAnswered && !isReveal && !room.buzzLocked ? (
          <p className={classes.hint}>
            {(
              t.play?.answerLockedHint ??
              "Answer locked in. Waiting for others ({count}/{total})…"
            )
              .replace("{count}", String(room.answeredCount))
              .replace("{total}", String(room.players.length))}
          </p>
        ) : null}

        {isReveal && hostPacing && isHost && onAdvance ? (
          <div className={classes.hostAdvance}>
            <Button onClick={onAdvance}>
              {t.play?.hostAdvance ?? "Next question"}
            </Button>
          </div>
        ) : null}
      </footer>
    </section>
  );
}
