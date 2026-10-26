"use client";

import { useEffect, useRef } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import classes from "./UndercoverRoleLottie.module.css";

const SIZE_PX = {
  sm: 40,
  md: 64,
  lg: 88,
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Square role icon — plays only while hovered / focused; size never changes. */
export default function RoleLottie({ src, size = "md" }) {
  const wrapRef = useRef(null);
  const playerRef = useRef(null);
  const px = SIZE_PX[size] || SIZE_PX.md;

  useEffect(() => {
    const player = playerRef.current;
    const wrap = wrapRef.current;
    if (!player || !wrap) return undefined;

    let ready = false;

    const freezeIdle = () => {
      try {
        const total = Number(player.totalFrames) || 0;
        if (total > 1) {
          player.setFrame?.(Math.floor(total * 0.35));
        }
      } catch {
        /* ignore */
      }
      player.pause?.();
    };

    const onReady = () => {
      if (ready) return;
      ready = true;
      try {
        player.setLayout?.({ fit: "contain", align: [0.5, 0.5] });
      } catch {
        /* ignore */
      }
      freezeIdle();
    };

    const play = () => {
      if (prefersReducedMotion()) return;
      player.play?.();
    };
    const pause = () => {
      freezeIdle();
    };
    const onFocusOut = (event) => {
      if (!wrap.contains(event.relatedTarget)) pause();
    };

    player.addEventListener?.("load", onReady);
    player.addEventListener?.("ready", onReady);
    onReady();

    wrap.addEventListener("mouseenter", play);
    wrap.addEventListener("mouseleave", pause);
    wrap.addEventListener("focusin", play);
    wrap.addEventListener("focusout", onFocusOut);

    return () => {
      player.removeEventListener?.("load", onReady);
      player.removeEventListener?.("ready", onReady);
      wrap.removeEventListener("mouseenter", play);
      wrap.removeEventListener("mouseleave", pause);
      wrap.removeEventListener("focusin", play);
      wrap.removeEventListener("focusout", onFocusOut);
    };
  }, [px, src]);

  return (
    <span
      ref={wrapRef}
      className={classes.wrap}
      style={{ width: px, height: px }}
    >
      <DotLottieReact
        src={src}
        loop
        autoplay={false}
        layout={{ fit: "contain", align: [0.5, 0.5] }}
        className={classes.player}
        style={{ width: px, height: px }}
        width={px}
        height={px}
        dotLottieRefCallback={(instance) => {
          playerRef.current = instance;
        }}
      />
    </span>
  );
}
