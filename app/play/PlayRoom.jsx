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
import GeographyModeView from "@/components/quiz/modes/geography/GeographyModeView";
import ClassicModeView from "@/components/quiz/modes/classic/ClassicModeView";
import UndercoverModeView from "@/components/quiz/modes/undercover/UndercoverModeView";
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
  const { setChromeMode } = useSiteChrome();
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
    advanceRound,
    sendGameAction,
    resetGame,
    rematchGame,
    sendQuestionFeedback,
    clearError,
  } = useQuizRoom();

  const isPlaying =
    room?.phase === "playing" || room?.phase === "reveal";
  const isFinalResults = room?.phase === "final_results";
  const isGeoEntry = !room && defaultMode === "geography";
  const isGeoSession = room?.mode === "geography";
  const isGeoLobby = isGeoSession && room?.phase === "lobby";
  const useGeoShell = isGeoEntry || isGeoSession;

  const isClassicEntry =
    !room && (defaultMode === "classic" || defaultMode === "picture");
  const isClassicSession =
    room?.mode === "classic" || room?.mode === "picture";
  const isClassicLobby = isClassicSession && room?.phase === "lobby";
  const useClassicShell = isClassicEntry || isClassicSession;

  const isUndercoverEntry = !room && defaultMode === "undercover";
  const isUndercoverSession = room?.mode === "undercover";
  const isUndercoverLobby = isUndercoverSession && room?.phase === "lobby";
  const useUndercoverShell = isUndercoverEntry || isUndercoverSession;

  const useImmersiveLobby =
    isGeoEntry ||
    isGeoLobby ||
    isClassicEntry ||
    isClassicLobby ||
    isUndercoverEntry ||
    isUndercoverLobby;
  const hidePlayTitle =
    isPlaying || isFinalResults || useImmersiveLobby;

  useEffect(() => {
    if (isPlaying || isFinalResults) {
      setChromeMode("immersive");
    } else if (useImmersiveLobby) {
      setChromeMode("overlay");
    } else {
      setChromeMode("default");
    }
    return () => setChromeMode("default");
  }, [isPlaying, isFinalResults, useImmersiveLobby, setChromeMode]);

  return (
    <main
      className={
        isPlaying
          ? classes.playingMain
          : isFinalResults
            ? classes.resultsMain
            : useImmersiveLobby
              ? classes.geoLobbyMain
              : undefined
      }
    >
      {!hidePlayTitle ? (
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

      {useGeoShell ? (
        <GeographyModeView
          room={room}
          isHost={isHost}
          onStart={startGame}
          onReset={resetGame}
          onRematch={rematchGame}
          onAction={sendGameAction}
          onUpdateConfig={updateRoomConfig}
          onPickTeam={pickTeam}
          onCreate={createRoom}
          onJoin={joinRoom}
          connected={connected}
          connectionError={connectionError}
          defaultName={defaultName}
          defaultRoomCode={defaultRoomCode}
          isSignedIn={Boolean(isSignedIn)}
          lang={lang}
        />
      ) : useClassicShell ? (
        <ClassicModeView
          room={room}
          isHost={isHost}
          onStart={startGame}
          onReset={resetGame}
          onRematch={rematchGame}
          onSubmit={submitAnswer}
          onAdvance={advanceRound}
          onQuestionFeedback={sendQuestionFeedback}
          onUpdateConfig={updateRoomConfig}
          onPickTeam={pickTeam}
          onCreate={createRoom}
          onJoin={joinRoom}
          connected={connected}
          connectionError={connectionError}
          defaultName={defaultName}
          defaultRoomCode={defaultRoomCode}
          defaultMode={defaultMode === "picture" ? "picture" : "classic"}
          isSignedIn={Boolean(isSignedIn)}
          lang={lang}
        />
      ) : useUndercoverShell ? (
        <UndercoverModeView
          room={room}
          isHost={isHost}
          onStart={startGame}
          onReset={resetGame}
          onRematch={rematchGame}
          onAction={sendGameAction}
          onUpdateConfig={updateRoomConfig}
          onCreate={createRoom}
          onJoin={joinRoom}
          connected={connected}
          connectionError={connectionError}
          defaultName={defaultName}
          defaultRoomCode={defaultRoomCode}
          isSignedIn={Boolean(isSignedIn)}
          lang={lang}
        />
      ) : !room ? (
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
          onRematch={rematchGame}
          onSubmit={submitAnswer}
          onAdvance={advanceRound}
          onQuestionFeedback={sendQuestionFeedback}
          onAction={sendGameAction}
          onUpdateConfig={updateRoomConfig}
          onPickTeam={pickTeam}
          lang={lang}
        />
      )}

      {!hidePlayTitle ? (
        <Link href={`/?lang=${lang}`} className={classes.backLink}>
          ← Back home
        </Link>
      ) : null}
    </main>
  );
}
