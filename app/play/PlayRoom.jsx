"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Title from "@/components/title/Title";
import QuizLobby from "@/components/quiz/QuizLobby";
import ModeView from "@/components/quiz/modes/ModeView";
import { parsePlayModeParam } from "@/lib/quiz/playMode";
import { useQuizRoom } from "@/hooks/useQuizRoom";
import classes from "./page.module.css";

export default function PlayRoom() {
  const searchParams = useSearchParams();
  const defaultMode = parsePlayModeParam(searchParams.get("mode"));
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
        <Title subtitle="Answer quickly — fastest correct answers earn the most points.">
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
