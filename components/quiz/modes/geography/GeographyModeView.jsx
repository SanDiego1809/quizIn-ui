"use client";

import QuizWaitingRoom from "@/components/quiz/QuizWaitingRoom";
import QuizResults from "@/components/quiz/QuizResults";
import EarthBackground from "./EarthBackground";
import GeoQuizQuestion from "./GeoQuizQuestion";
import { renderGeoReviewItem } from "./geoReview";
import lobbyClasses from "./GeographyLobby.module.css";

export default function GeographyModeView({
  room,
  isHost,
  onStart,
  onReset,
  onAction,
  onUpdateConfig,
  onPickTeam,
  lang = "en",
}) {
  return (
    <>
      {room.phase === "lobby" ? (
        <div className={lobbyClasses.shell}>
          <EarthBackground />
          <div className={lobbyClasses.overlay}>
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
          </div>
        </div>
      ) : null}

      {room.phase === "playing" ? (
        <GeoQuizQuestion
          room={room}
          onSubmit={(countryCode) =>
            onAction({ type: "submit_country", countryCode })
          }
          lang={lang}
        />
      ) : null}

      {room.phase === "final_results" ? (
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
