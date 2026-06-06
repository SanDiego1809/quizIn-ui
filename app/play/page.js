"use client";

import Link from "next/link";
import Title from "@/components/title/Title";
import QuizLobby from "@/components/quiz/QuizLobby";
import QuizWaitingRoom from "@/components/quiz/QuizWaitingRoom";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import QuizResults from "@/components/quiz/QuizResults";
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
    submitAnswer,
    resetGame,
    clearError,
  } = useQuizRoom();

  return (
    <main>
      <Title subtitle="Answer 4 questions — fastest correct answers win bragging rights.">
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
      ) : null}

      {room?.phase === "lobby" ? (
        <QuizWaitingRoom
          room={room}
          isHost={isHost}
          onStart={startGame}
          onReset={resetGame}
        />
      ) : null}

      {room?.phase === "playing" ? (
        <QuizQuestion room={room} onSubmit={submitAnswer} />
      ) : null}

      {room?.phase === "final_results" ? (
        <QuizResults room={room} isHost={isHost} onReset={resetGame} />
      ) : null}

      <Link href="/" className={classes.backLink}>
        ← Back home
      </Link>
    </main>
  );
}
