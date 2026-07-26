"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import classes from "./GeoQuizQuestion.module.css";

// d3-geo touches the DOM-free geometry math only, but we still load it
// on the client only to keep it out of the server bundle and to match
// the pattern already used for the (three.js based) avatar room.
const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });

function formatCountdown(deadline) {
  if (!deadline) return null;
  const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  return `${seconds}s`;
}

export default function GeoQuizQuestion({ room, onSubmit }) {
  const [countdown, setCountdown] = useState(null);
  const [pendingCode, setPendingCode] = useState(null);
  const questionNumber = (room.currentQuestionIndex ?? 0) + 1;

  useEffect(() => {
    setPendingCode(null);
  }, [room.currentQuestionIndex]);

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

  function handleSelectCountry(code) {
    if (room.hasAnswered) return;
    setPendingCode(code);
    onSubmit(code);
  }

  return (
    <section className={classes.stage}>
      <header className={classes.header}>
        <span className={classes.progress}>
          Country {questionNumber} / {room.totalQuestions}
        </span>
        {countdown ? <span className={classes.timer}>{countdown}</span> : null}
      </header>

      <h2 className={classes.question}>
        Click on:{" "}
        <span className={classes.countryName}>
          {room.question?.countryName}
        </span>
      </h2>

      <div className={classes.mapArea}>
        <WorldMap
          onSelectCountry={handleSelectCountry}
          disabled={room.hasAnswered}
          pendingCode={pendingCode}
        />
      </div>

      <p className={classes.hint}>
        {room.hasAnswered
          ? `Answer locked in. Waiting for others (${room.answeredCount}/${room.players.length})…`
          : "Tap the country on the map. Scroll or pinch to zoom, drag to pan."}
      </p>
    </section>
  );
}
