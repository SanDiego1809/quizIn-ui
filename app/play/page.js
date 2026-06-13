"use client";

import Link from "next/link";
import Title from "@/components/title/Title";
import QuizLobby from "@/components/quiz/QuizLobby";
import ModeView from "@/components/quiz/modes/ModeView";
import { useQuizRoom } from "@/hooks/useQuizRoom";
import classes from "./page.module.css";

export default function PlayPage() {
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

  return (
    <main>
      <Title subtitle="Answer questions — fastest correct answers win bragging rights.">
        Quiz room
      </Title>

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

      <Link href="/" className={classes.backLink}>
        ← Back home
      </Link>
    </main>
  );
}
