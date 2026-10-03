"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Title from "@/components/title/Title";
import { getTranslations } from "@/lib/i18n";
import QuizLobby from "@/components/quiz/QuizLobby";
import ModeView from "@/components/quiz/modes/ModeView";
import { parsePlayModeParam } from "@/lib/quiz/playMode";
import { useQuizRoom } from "@/hooks/useQuizRoom";
import classes from "./page.module.css";

export default function PlayRoom({ lang: propLang } = {}) {
  const searchParams = useSearchParams();
  const defaultMode = parsePlayModeParam(searchParams.get("mode"));
  // Initialize lang from server prop (propLang) to match SSR output.
  const [lang, setLang] = useState(propLang || "en");

  // After mount, prefer query param or stored local choice.
  useEffect(() => {
    try {
      const qLang = searchParams.get("lang");
      const stored = localStorage.getItem("quizin_lang");
      if (qLang && qLang !== lang) {
        setLang(qLang);
        localStorage.setItem("quizin_lang", qLang);
        return;
      }
      if (stored && stored !== lang) {
        setLang(stored);
      }
    } catch (e) {
      // ignore
    }
  }, []); // run once on mount

  useEffect(() => {
    try {
      localStorage.setItem("quizin_lang", lang);
    } catch {}
  }, [lang]);
  const {
    room,
    error,
    connected,
    connectionError,
    isHost,
    createRoom,
    joinRoom,
    startGame,
    updateRoomConfig,
    submitAnswer,
    sendGameAction,
    resetGame,
    clearError,
  } = useQuizRoom();

  const isPlaying = room?.phase === "playing";
  const isFinalResults = room?.phase === "final_results";
  const hidePageChrome = isPlaying || isFinalResults;

  return (
    <main
      className={
        isPlaying
          ? classes.playingMain
          : isFinalResults
            ? classes.resultsMain
            : undefined
      }
    >
      {!hidePageChrome ? (
        <Title subtitle={getTranslations(lang).play.roomSubtitle}>
          Quiz room
        </Title>
      ) : null}

      {error ? (
        <div className={classes.error} role="alert">
          <p>{error}</p>
          <button type="button" className={classes.dismiss} onClick={clearError}>
            Dismiss
          </button>
        </div>
      ) : null}

      {!room ? (
        <QuizLobby
          connected={connected}
          connectionError={connectionError}
          onCreate={createRoom}
          onJoin={joinRoom}
          defaultMode={defaultMode}
          lang={lang}
        />
      ) : (
        <ModeView
          room={room}
          isHost={isHost}
          onStart={startGame}
          onReset={resetGame}
          onSubmit={submitAnswer}
          onAction={sendGameAction}
          onUpdateConfig={updateRoomConfig}
          lang={lang}
        />
      )}

      {!hidePageChrome ? (
        <Link href="/" className={classes.backLink}>
          ← Back home
        </Link>
      ) : null}
    </main>
  );
}
