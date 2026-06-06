"use client";

import { useEffect, useState } from "react";
import classes from "./QuizQuestion.module.css";
import Button from "@/components/button/Button";

function formatCountdown(deadline) {
  if (!deadline) return null;
  const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  return `${seconds}s`;
}

export default function QuizQuestion({ room, onSubmit }) {
  const [countdown, setCountdown] = useState(null);

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

  const questionNumber = (room.currentQuestionIndex ?? 0) + 1;

  return (
    <section className={classes.panel}>
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
    </section>
  );
}
