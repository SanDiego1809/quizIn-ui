"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import classes from "./QuizResults.module.css";
import Button from "@/components/button/Button";
import { getTranslations } from "@/lib/i18n";
import {
  DEFAULT_ANIMATION,
  DEFAULT_VICTORY_ANIMATION,
} from "@/lib/quiz/animations";
import { DEFAULT_SKIN } from "@/lib/quiz/cosmetics";

const AvatarScene = dynamic(() => import("@/components/avatar/AvatarScene"), {
  ssr: false,
});

const SUSPENSE_MS = 1800;
const REVEAL_MS = 1200;
const CELEBRATE_MS = 2800;

const PHASE = {
  SUSPENSE: "suspense",
  REVEAL: "reveal",
  CELEBRATE: "celebrate",
  DETAILS: "details",
};

function placeLabel(rank) {
  if (rank === 1) return "1";
  return String(rank);
}

function defaultRenderReviewItem(q, index, { yourPlayerId, classes: css }) {
  const yourIndex = q.answers?.[yourPlayerId];
  const correctText = q.options[q.correctIndex];
  const pickedWrong =
    yourIndex != null && yourIndex >= 0 && yourIndex !== q.correctIndex;
  const missed = yourIndex === -1 || yourIndex === undefined;

  return (
    <article key={q.id} className={css.reviewItem}>
      <p className={css.reviewQuestion}>
        {index + 1}. {q.text}
      </p>
      <div className={css.answerCompare}>
        <span className={css.correct}>✅ {correctText}</span>
        {pickedWrong ? (
          <span className={css.wrong}>❌ {q.options[yourIndex]}</span>
        ) : null}
        {missed ? <span className={css.wrong}>❌ Pas de réponse</span> : null}
      </div>
    </article>
  );
}

export default function QuizResults({
  room,
  isHost,
  onReset,
  renderReviewItem = defaultRenderReviewItem,
  lang = "en",
}) {
  const { result, questionReview, yourPlayerId } = room;
  const all = getTranslations(lang);
  const t = all.results ?? {};
  const rankings = result?.rankings ?? [];

  const rankingsKey = useMemo(
    () => rankings.map((entry) => `${entry.playerId}:${entry.score}`).join("|"),
    [rankings]
  );

  const winnerEntry = rankings[0] ?? null;
  const winnerPlayer = useMemo(() => {
    if (!winnerEntry) return null;
    return (
      room.players.find((player) => player.id === winnerEntry.playerId) ?? null
    );
  }, [room.players, winnerEntry]);

  const [phase, setPhase] = useState(
    rankings.length ? PHASE.SUSPENSE : PHASE.DETAILS
  );

  useEffect(() => {
    if (!rankings.length) {
      setPhase(PHASE.DETAILS);
      return undefined;
    }

    setPhase(PHASE.SUSPENSE);

    const revealTimer = window.setTimeout(() => {
      setPhase(PHASE.REVEAL);
    }, SUSPENSE_MS);

    const celebrateTimer = window.setTimeout(() => {
      setPhase(PHASE.CELEBRATE);
    }, SUSPENSE_MS + REVEAL_MS);

    const detailsTimer = window.setTimeout(() => {
      setPhase(PHASE.DETAILS);
    }, SUSPENSE_MS + REVEAL_MS + CELEBRATE_MS);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(celebrateTimer);
      window.clearTimeout(detailsTimer);
    };
  }, [rankingsKey, rankings.length]);

  const showWinnerName =
    phase === PHASE.REVEAL ||
    phase === PHASE.CELEBRATE ||
    phase === PHASE.DETAILS;
  const showCelebration =
    phase === PHASE.CELEBRATE || phase === PHASE.DETAILS;
  const showDetails = phase === PHASE.DETAILS;
  const isYouWinner = winnerEntry?.playerId === yourPlayerId;

  const victoryAnimation =
    winnerPlayer?.victoryAnimation || DEFAULT_VICTORY_ANIMATION;
  const victorySkin = winnerPlayer?.skinKey ?? DEFAULT_SKIN;

  return (
    <section
      className={[
        classes.stage,
        phase === PHASE.CELEBRATE ? classes.stageCelebrate : "",
        showDetails ? classes.stageDetails : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={classes.backdrop} aria-hidden="true">
        <span className={classes.spotlight} />
        <span className={classes.glow} />
        <span className={classes.vignette} />
        {showCelebration ? (
          <>
            <span className={`${classes.confetti} ${classes.confettiA}`} />
            <span className={`${classes.confetti} ${classes.confettiB}`} />
            <span className={`${classes.confetti} ${classes.confettiC}`} />
            <span className={`${classes.confetti} ${classes.confettiD}`} />
            <span className={`${classes.confetti} ${classes.confettiE}`} />
            <span className={`${classes.confetti} ${classes.confettiF}`} />
          </>
        ) : null}
      </div>

      <div className={classes.content}>
        {!showDetails ? (
          <div className={classes.hero}>
            <header className={classes.intro}>
              <p className={classes.eyebrow}>{t.matchEnded}</p>
              <h2
                className={[
                  classes.title,
                  phase === PHASE.SUSPENSE ? classes.titleSuspense : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {t.andTheWinnerIs}
              </h2>
            </header>

            {showWinnerName && winnerEntry ? (
              <div
                className={[
                  classes.winnerReveal,
                  phase === PHASE.REVEAL ? classes.winnerRevealEnter : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <p className={classes.winnerLabel}>{t.winnerLabel}</p>
                <h3 className={classes.winnerName}>
                  {winnerEntry.name}
                  {isYouWinner ? (
                    <span className={classes.youTag}> {t.youTag}</span>
                  ) : null}
                </h3>
                <p className={classes.winnerScore}>
                  {winnerEntry.score} pts
                  {result?.maxScore ? ` / ${result.maxScore}` : ""}
                </p>
              </div>
            ) : (
              <div className={classes.suspensePulse} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            )}

            {showCelebration && winnerEntry ? (
              <div className={classes.victoryScene}>
                <AvatarScene
                  animation={victoryAnimation}
                  skinKey={victorySkin}
                  restoreIdleAfterPreview={false}
                  className={classes.victoryCanvas}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <header className={classes.intro}>
              <p className={classes.eyebrow}>{t.matchEnded}</p>
              <h2 className={classes.title}>
                {t.rankingsHeading ?? "Final ranking"}
              </h2>
            </header>

            {winnerEntry ? (
              <div className={classes.winnerSummary}>
                <div className={classes.winnerSummaryScene}>
                  <AvatarScene
                    animation={DEFAULT_ANIMATION}
                    skinKey={victorySkin}
                    className={classes.victoryCanvasSmall}
                  />
                </div>
                <div className={classes.winnerSummaryBody}>
                  <p className={classes.winnerLabel}>{t.winnerLabel}</p>
                  <h3 className={classes.winnerNameCompact}>
                    {winnerEntry.name}
                    {isYouWinner ? (
                      <span className={classes.youTag}> {t.youTag}</span>
                    ) : null}
                  </h3>
                  <p className={classes.winnerScore}>
                    {winnerEntry.score} pts
                    {result?.maxScore ? ` / ${result.maxScore}` : ""}
                  </p>
                </div>
              </div>
            ) : null}

            {result?.teamRankings?.length ? (
              <ol className={classes.podium} aria-label={t.teamRankingsHeading}>
                {result.teamRankings.map((team, index) => {
                  const isWinner = index === 0;
                  const memberNames = team.members
                    .map((member) => member.name)
                    .join(" · ");
                  const teamLabel =
                    team.teamId === "red"
                      ? t.teamRed ?? all.settings?.teamRed ?? team.name
                      : t.teamBlue ?? all.settings?.teamBlue ?? team.name;
                  return (
                    <li key={team.teamId} className={classes.podiumItem}>
                      <div
                        className={
                          isWinner
                            ? classes.winnerRowCompact
                            : classes.podiumRow
                        }
                      >
                        <span className={classes.podiumPlace}>
                          {placeLabel(index + 1)}
                        </span>
                        <span className={classes.podiumName}>
                          {teamLabel}
                          <span className={classes.youTag}> — {memberNames}</span>
                        </span>
                        <span className={classes.podiumScore}>
                          {team.score} pts
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <ol className={classes.podium} aria-label={t.rankingsHeading}>
                {(result?.playerRankings ?? rankings).map((entry, index) => {
                  const rank = index + 1;
                  const isWinner = rank === 1;
                  const isYou = entry.playerId === yourPlayerId;
                  const scoreLabel = `${entry.score} pts${
                    result?.maxScore ? ` / ${result.maxScore}` : ""
                  }`;

                  return (
                    <li key={entry.playerId} className={classes.podiumItem}>
                      <div
                        className={
                          isWinner
                            ? classes.winnerRowCompact
                            : classes.podiumRow
                        }
                      >
                        <span className={classes.podiumPlace}>
                          {placeLabel(rank)}
                        </span>
                        <span className={classes.podiumName}>
                          {entry.name}
                          {isYou ? (
                            <span className={classes.youTag}> {t.youTag}</span>
                          ) : null}
                        </span>
                        <span className={classes.podiumScore}>{scoreLabel}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className={classes.details}>
              {questionReview?.length ? (
                <details className={classes.review}>
                  <summary className={classes.reviewSummary}>
                    {t.viewReview}
                  </summary>
                  <div className={classes.reviewBody}>
                    {questionReview.map((q, index) =>
                      renderReviewItem(q, index, {
                        yourPlayerId,
                        classes,
                        lang,
                      })
                    )}
                  </div>
                </details>
              ) : null}

              <footer className={classes.actions}>
                {isHost ? (
                  <Button onClick={onReset}>{t.replay}</Button>
                ) : (
                  <p className={classes.hint}>{t.waitingHostRestart}</p>
                )}
              </footer>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
