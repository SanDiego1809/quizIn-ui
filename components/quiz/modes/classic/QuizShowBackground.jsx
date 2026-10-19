"use client";

import { useEffect, useRef } from "react";
import classes from "./QuizShowBackground.module.css";

export const STAGE_SRC = "/classic/quiz-show-stage.jpg";
/** Vertical fraction (from top) where the stage floor reads under cover crop. */
export const STAGE_FLOOR = "72%";

/**
 * Photoreal quiz-show stage backdrop with animated light washes
 * and a CSS host desk in the mid-foreground (not a full low-poly set).
 */
export default function QuizShowBackground({
  className = "",
  showDesk = true,
  visible = true,
  /** When true, fills a fixed stage frame (no viewport-dependent crop drift). */
  framed = false,
  onReady,
}) {
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onReadyRef.current?.();
    };

    const img = new Image();
    img.onload = finish;
    img.onerror = finish;
    img.src = STAGE_SRC;
    if (img.complete) finish();

    return () => {
      done = true;
    };
  }, []);

  return (
    <div
      className={`${classes.root}${framed ? ` ${classes.framed}` : ""}${
        visible ? "" : ` ${classes.hidden}`
      }${className ? ` ${className}` : ""}`}
      style={{ "--stage-floor": STAGE_FLOOR }}
      aria-hidden="true"
    >
      <img
        className={classes.stageImage}
        src={STAGE_SRC}
        alt=""
        draggable={false}
      />
      <div className={classes.stageGrade} />
      <div className={classes.wash} />
      <div className={`${classes.beam} ${classes.beamA}`} />
      <div className={`${classes.beam} ${classes.beamB}`} />
      <div className={`${classes.beam} ${classes.beamC}`} />
      <div className={`${classes.flare} ${classes.flareWarm}`} />
      <div className={`${classes.flare} ${classes.flareCool}`} />
      <div className={classes.vignette} />

      {showDesk ? (
        <div className={classes.deskWrap}>
          <div className={classes.desk}>
            <div className={`${classes.monitor} ${classes.monitorLeft}`}>
              <div className={classes.monitorGlow} />
            </div>
            <div className={`${classes.monitor} ${classes.monitorRight}`}>
              <div className={classes.monitorGlow} />
            </div>
            <div className={classes.deskTop} />
            <div className={classes.deskFront} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
