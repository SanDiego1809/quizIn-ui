"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Title from "@/components/title/Title";
import { useLang } from "@/components/site/LangProvider";
import { useSiteChrome } from "@/components/site/SiteChrome";
import { getTranslations } from "@/lib/i18n";
import QuizLobby from "@/components/quiz/QuizLobby";
import ModeView from "@/components/quiz/modes/ModeView";
import { parsePlayModeParam } from "@/lib/quiz/playMode";
import { useQuizRoom } from "@/hooks/useQuizRoom";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import classes from "./page.module.css";

export default function PlayRoom() {
  const searchParams = useSearchParams();
  const defaultMode = parsePlayModeParam(searchParams.get("mode"));
  const defaultRoomCode = String(searchParams.get("code") || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  const { lang } = useLang();
  const { setImmersive } = useSiteChrome();
  const { defaultName, isSignedIn } = usePlayerProfile();
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
    pickTeam,
    submitAnswer,
    sendGameAction,
    resetGame,
    clearError,
  } = useQuizRoom();

  const isPlaying = room?.phase === "playing";
  const isFinalResults = room?.phase === "final_results";
  const isGeoLobby =
    room?.mode === "geography" && room?.phase === "lobby";
  const hidePageChrome = isPlaying || isFinalResults || isGeoLobby;

  useEffect(() => {
    setImmersive(hidePageChrome);
    return () => setImmersive(false);
  }, [hidePageChrome, setImmersive]);

  return (
    <main
      className={
        isPlaying
          ? classes.playingMain
          : isFinalResults
            ? classes.resultsMain
            : isGeoLobby
              ? classes.geoLobbyMain
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
          defaultName={defaultName}
          defaultRoomCode={defaultRoomCode}
          isSignedIn={Boolean(isSignedIn)}
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
          onPickTeam={pickTeam}
          lang={lang}
        />
      )}

      {!hidePageChrome ? (
        <Link href={`/?lang=${lang}`} className={classes.backLink}>
          ← Back home
        </Link>
      ) : null}
    </main>
  );
}
