"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  ANIMATIONS,
  ANIMATION_PREVIEW_MS,
  DEFAULT_ANIMATION,
} from "@/lib/quiz/animations";
import { getQuizSocket } from "@/lib/quiz/socket";
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

function getPlayerAnimation(room) {
  const player = room.players.find((entry) => entry.id === room.yourPlayerId);
  return player?.animation ?? DEFAULT_ANIMATION;
}

function emitPlayerAnimation(roomCode, animation) {
  getQuizSocket()?.emit("quiz:player_animation", { roomCode, animation });
}

export default function QuizQuestion({ room, onSubmit }) {
  const [countdown, setCountdown] = useState(null);
  const [animation, setAnimation] = useState(() => getPlayerAnimation(room));
  const skipPreviewTimerRef = useRef(true);
  const questionNumber = (room.currentQuestionIndex ?? 0) + 1;

  const remoteAnimationKey = useMemo(
    () =>
      room.players
        .map((player) => `${player.id}:${player.animation ?? DEFAULT_ANIMATION}`)
        .join(","),
    [room.players]
  );

  const scenePlayers = useMemo(() => {
    const answeredSet = new Set(room.answeredPlayerIds ?? []);
    return room.players.map((player) => ({
      id: player.id,
      name: player.name,
      animation:
        player.id === room.yourPlayerId
          ? animation
          : (player.animation ?? DEFAULT_ANIMATION),
      answered: answeredSet.has(player.id),
    }));
  }, [
    room.players,
    room.yourPlayerId,
    room.answeredPlayerIds,
    animation,
    remoteAnimationKey,
  ]);

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

  useEffect(() => {
    if (skipPreviewTimerRef.current) {
      skipPreviewTimerRef.current = false;
      return undefined;
    }

    if (animation === DEFAULT_ANIMATION) return undefined;

    const timeoutId = window.setTimeout(() => {
      setAnimation(DEFAULT_ANIMATION);
      emitPlayerAnimation(room.roomCode, DEFAULT_ANIMATION);
    }, ANIMATION_PREVIEW_MS);

    return () => window.clearTimeout(timeoutId);
  }, [animation, room.roomCode]);

  function handleAnimationChange(nextAnimation) {
    setAnimation(nextAnimation);
    emitPlayerAnimation(room.roomCode, nextAnimation);
  }

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

        <label className={classes.animationPicker}>
          <span className={classes.animationLabel}>Animation</span>
          <select
            className={classes.animationSelect}
            value={animation}
            onChange={(e) => handleAnimationChange(e.target.value)}
          >
            {ANIMATIONS.map((anim) => (
              <option key={anim} value={anim}>
                {anim}
              </option>
            ))}
          </select>
        </label>
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
