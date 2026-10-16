"use client";

import QuizWaitingRoom from "@/components/quiz/QuizWaitingRoom";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import QuizResults from "@/components/quiz/QuizResults";

export default function ClassicModeView({
  room,
  isHost,
  onStart,
  onReset,
  onSubmit,
  onUpdateConfig,
  onPickTeam,
  lang = "en",
}) {
  return (
    <>
      {room.phase === "lobby" ? (
        <QuizWaitingRoom
          room={room}
          isHost={isHost}
          onStart={onStart}
          onReset={onReset}
          onUpdateConfig={onUpdateConfig}
          onPickTeam={onPickTeam}
          lang={lang}
        />
      ) : null}

      {room.phase === "playing" ? (
        <QuizQuestion room={room} onSubmit={onSubmit} lang={lang} />
      ) : null}

      {room.phase === "final_results" ? (
        <QuizResults room={room} isHost={isHost} onReset={onReset} lang={lang} />
      ) : null}
    </>
  );
}
