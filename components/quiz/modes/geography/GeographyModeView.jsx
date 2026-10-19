"use client";

import QuizLobby from "@/components/quiz/QuizLobby";
import QuizWaitingRoom from "@/components/quiz/QuizWaitingRoom";
import QuizResults from "@/components/quiz/QuizResults";
import EarthBackground from "./EarthBackground";
import GeoQuizQuestion from "./GeoQuizQuestion";
import { renderGeoReviewItem } from "./geoReview";
import lobbyClasses from "./GeographyLobby.module.css";

export default function GeographyModeView({
  room = null,
  isHost = false,
  onStart,
  onReset,
  onAction,
  onUpdateConfig,
  onPickTeam,
  onCreate,
  onJoin,
  connected = false,
  connectionError = null,
  defaultName = "",
  defaultRoomCode = "",
  isSignedIn = false,
  lang = "en",
}) {
  const isEntry = !room;
  const isLobby = room?.phase === "lobby";
  const showShell = isEntry || isLobby;

  return (
    <>
      {showShell ? (
        <div className={lobbyClasses.shell}>
          <EarthBackground />
          <div
            className={`${lobbyClasses.overlay} ${
              isEntry ? lobbyClasses.overlayEntry : lobbyClasses.overlayLobby
            }`}
          >
            {isEntry ? (
              <>
                <QuizLobby
                  variant="geo"
                  connected={connected}
                  connectionError={connectionError}
                  onCreate={onCreate}
                  onJoin={onJoin}
                  defaultMode="geography"
                  defaultName={defaultName}
                  defaultRoomCode={defaultRoomCode}
                  isSignedIn={isSignedIn}
                  lang={lang}
                />
                <div className={lobbyClasses.entryCenter} aria-hidden="true" />
              </>
            ) : (
              <QuizWaitingRoom
                room={room}
                isHost={isHost}
                onStart={onStart}
                onReset={onReset}
                onUpdateConfig={onUpdateConfig}
                onPickTeam={onPickTeam}
                lang={lang}
                variant="geoLobby"
              />
            )}
          </div>
        </div>
      ) : null}

      {room?.phase === "playing" || room?.phase === "reveal" ? (
        <GeoQuizQuestion
          room={room}
          onSubmit={(countryCode) =>
            onAction({ type: "submit_country", countryCode })
          }
          lang={lang}
        />
      ) : null}

      {room?.phase === "final_results" ? (
        <QuizResults
          room={room}
          isHost={isHost}
          onReset={onReset}
          renderReviewItem={renderGeoReviewItem}
          lang={lang}
        />
      ) : null}
    </>
  );
}
