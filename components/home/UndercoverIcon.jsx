"use client";

import { useEffect, useRef } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import styles from "./UndercoverIcon.module.css";

/** Ispettore Privacy by Armando Rinaldi, Lottie Simple License.
    https://lottiefiles.com/free-animation/ispettore-privacy-5nQfuQ4eRe */
export default function UndercoverIcon() {
  const sceneRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const card = sceneRef.current?.closest("article");
    if (!card) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const play = () => playerRef.current?.play();
    const pause = () => playerRef.current?.pause();
    const onFocusOut = (event) => {
      if (!card.contains(event.relatedTarget)) pause();
    };

    card.addEventListener("mouseenter", play);
    card.addEventListener("mouseleave", pause);
    card.addEventListener("focusin", play);
    card.addEventListener("focusout", onFocusOut);

    return () => {
      card.removeEventListener("mouseenter", play);
      card.removeEventListener("mouseleave", pause);
      card.removeEventListener("focusin", play);
      card.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <div ref={sceneRef} className={styles.scene} aria-hidden="true">
      <DotLottieReact
        src="/animations/ispettore-privacy.lottie"
        loop
        autoplay={false}
        className={styles.player}
        dotLottieRefCallback={(instance) => {
          playerRef.current = instance;
        }}
      />
    </div>
  );
}
