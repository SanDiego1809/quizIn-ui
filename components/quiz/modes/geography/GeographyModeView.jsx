"use client";

import QuizWaitingRoom from "@/components/quiz/QuizWaitingRoom";
import QuizResults from "@/components/quiz/QuizResults";
import GeoQuizQuestion from "./GeoQuizQuestion";
import { renderGeoReviewItem } from "./geoReview";

export default function GeographyModeView({
  room,
  isHost,
  onStart,
  onReset,
  onAction,
  onUpdateConfig,
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
          lang={lang}
        />
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
