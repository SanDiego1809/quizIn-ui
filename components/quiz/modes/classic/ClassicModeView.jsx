"use client";

import { useEffect, useState } from "react";
import QuizLobby from "@/components/quiz/QuizLobby";
import QuizWaitingRoom from "@/components/quiz/QuizWaitingRoom";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import QuizResults from "@/components/quiz/QuizResults";
import QuizShowBackground, {
  STAGE_FLOOR,
} from "./QuizShowBackground";
import lobbyClasses from "./ClassicLobby.module.css";

export default function ClassicModeView({
  room = null,
  isHost = false,
  onStart,
  onReset,
  onRematch,
  onSubmit,
  onAdvance,
  onQuestionFeedback,
  onUpdateConfig,
  onPickTeam,
  onCreate,
  onJoin,
  connected = false,
  connectionError = null,
  defaultName = "",
  defaultRoomCode = "",
  defaultMode = "classic",
  isSignedIn = false,
  lang = "en",
}) {
  const isEntry = !room;
  const isLobby = room?.phase === "lobby";
  const isQuestion =
    room?.phase === "playing" || room?.phase === "reveal";
  const isResults = room?.phase === "final_results";
  const isPlay = isQuestion || isResults;
  const showShell = isEntry || isLobby || isPlay;

  const [stageReady, setStageReady] = useState(false);
  const [avatarsReady, setAvatarsReady] = useState(false);
  const playSceneReady = stageReady && (isResults || avatarsReady);

  useEffect(() => {
    if (!isPlay) {
      setAvatarsReady(false);
    }
  }, [isPlay]);

  // Rematch jumps final_results → playing without leaving isPlay; reload avatars.
  useEffect(() => {
    if (room?.phase === "playing" && room?.currentQuestionIndex === 0) {
      setAvatarsReady(false);
    }
  }, [room?.phase, room?.currentQuestionIndex]);

  return (
    <>
      {showShell ? (
        <div
          className={lobbyClasses.shell}
          style={{ "--stage-floor": STAGE_FLOOR }}
        >
          {isPlay ? (
            <>
              {!playSceneReady ? (
                <div
                  className={lobbyClasses.playLoader}
                  aria-busy="true"
                  aria-live="polite"
                >
                  <span
                    className={lobbyClasses.playLoaderSpinner}
                    aria-hidden="true"
                  />
                  <span>Loading stage…</span>
                </div>
              ) : null}

              <div className={lobbyClasses.stageFrame}>
                <QuizShowBackground
                  framed
                  showDesk={false}
                  visible={playSceneReady}
                  onReady={() => setStageReady(true)}
                />
              </div>

              {/* Avatars + ranking + questions — viewport-relative above the bar. */}
              <div
                className={`${lobbyClasses.overlay} ${lobbyClasses.overlayPlay}${
                  playSceneReady ? "" : ` ${lobbyClasses.overlayPlayPending}`
                }`}
              >
                {isQuestion ? (
                  <QuizQuestion
                    room={room}
                    onSubmit={onSubmit}
                    onAdvance={onAdvance}
                    onQuestionFeedback={onQuestionFeedback}
                    isHost={isHost}
                    lang={lang}
                    variant="classicShow"
                    onSceneReady={() => {
                      setAvatarsReady(true);
                    }}
                  />
                ) : null}

                {isResults ? (
                  <QuizResults
                    room={room}
                    isHost={isHost}
                    onReset={onReset}
                    onRematch={onRematch}
                    lang={lang}
                    variant="classicShow"
                  />
                ) : null}
              </div>
            </>
          ) : (
            <>
              <QuizShowBackground
                showDesk
                visible
                onReady={() => setStageReady(true)}
              />
              <div
                className={`${lobbyClasses.overlay} ${
                  isEntry
                    ? lobbyClasses.overlayEntry
                    : lobbyClasses.overlayLobby
                }`}
              >
                {isEntry ? (
                  <>
                    <QuizLobby
                      variant="classic"
                      connected={connected}
                      connectionError={connectionError}
                      onCreate={onCreate}
                      onJoin={onJoin}
                      defaultMode={defaultMode}
                      defaultName={defaultName}
                      defaultRoomCode={defaultRoomCode}
                      isSignedIn={isSignedIn}
                      lang={lang}
                    />
                    <div
                      className={lobbyClasses.entryCenter}
                      aria-hidden="true"
                    />
                  </>
                ) : null}

                {isLobby ? (
                  <QuizWaitingRoom
                    room={room}
                    isHost={isHost}
                    onStart={onStart}
                    onReset={onReset}
                    onUpdateConfig={onUpdateConfig}
                    onPickTeam={onPickTeam}
                    lang={lang}
                    variant="classicLobby"
                  />
                ) : null}
              </div>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}
