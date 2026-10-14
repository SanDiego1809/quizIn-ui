"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { DEFAULT_ANIMATION } from "@/lib/quiz/animations";
import { DEFAULT_SKIN } from "@/lib/quiz/cosmetics";
import classes from "./QuizQuestion.module.css";
import Button from "@/components/button/Button";

const QuizAvatarRoom = dynamic(
  () => import("@/components/avatar/QuizAvatarRoom"),
  { ssr: false }
);

function formatCountdown(deadline) {
  if (!deadline) return null;
  const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  return `${seconds}s`;
}

export default function QuizQuestion({ room, onSubmit }) {
  const [countdown, setCountdown] = useState(null);
  const questionNumber = (room.currentQuestionIndex ?? 0) + 1;

  const scenePlayers = useMemo(() => {
    const answeredSet = new Set(room.answeredPlayerIds ?? []);
    return room.players.map((player) => ({
      id: player.id,
      name: player.name,
      animation: DEFAULT_ANIMATION,
      skinKey: player.skinKey ?? DEFAULT_SKIN,
      answered: answeredSet.has(player.id),
    }));
  }, [room.players, room.answeredPlayerIds]);

  useEffect(() => {
    if (!room.phaseDeadline) {
      setCountdown(null);
      return undefined;
    }

    const tick = () => setCountdown(formatCountdown(room.phaseDeadline));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [room.phaseDeadline]);

  return (
    <section className={classes.stage}>
      <div className={classes.sceneArea}>
        <div className={classes.room}>
          <QuizAvatarRoom
            players={scenePlayers}
            yourPlayerId={room.yourPlayerId}
            className={classes.roomCanvas}
          />
        </div>
      </div>

      <footer className={classes.questionBar}>
        <header className={classes.header}>
          <span className={classes.progress}>
            Question {questionNumber} / {room.totalQuestions}
          </span>
          {countdown ? <span className={classes.timer}>{countdown}</span> : null}
        </header>

        <h2 className={classes.question}>{room.question?.text}</h2>

        <div className={classes.options}>
          {room.question?.options.map((option, index) => (
            <Button
              key={`${room.question.id}-${index}`}
              className={classes.option}
              variant="secondary"
              disabled={room.hasAnswered}
              onClick={() => onSubmit(index)}
            >
              {option}
            </Button>
          ))}
        </div>

        {room.hasAnswered ? (
          <p className={classes.hint}>
            Answer locked in. Waiting for others ({room.answeredCount}/
            {room.players.length})…
          </p>
        ) : null}
      </footer>
    </section>
  );
}
