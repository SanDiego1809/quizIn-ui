"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import classes from "./QuizResults.module.css";
import Button from "@/components/button/Button";
import { getTranslations } from "@/lib/i18n";

const REVEAL_DELAY_MS = 1200;
const CELEBRATION_DELAY_MS = 500;
const SLIDE_TRANSITION = "transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)";

function TrophyIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M16 8h32v6c0 8.8-4.6 16.5-11.5 20.8L32 52l-4.5-17.2C20.6 30.5 16 22.8 16 14V8z"
        fill="url(#trophyGradient)"
        stroke="#fbbf24"
        strokeWidth="1.5"
      />
      <path
        d="M16 10H8c0 6 3 10 8 11M48 10h8c0 6-3 10-8 11"
        stroke="#fbbf24"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="22" y="52" width="20" height="4" rx="1" fill="#b45309" />
      <rect x="18" y="56" width="28" height="4" rx="1.5" fill="#92400e" />
      <defs>
        <linearGradient id="trophyGradient" x1="32" y1="8" x2="32" y2="44">
          <stop stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function placeLabel(rank) {
  if (rank === 1) return "1er";
  return `${rank}e`;
}

function defaultRenderReviewItem(q, index, { yourPlayerId, classes }) {
  const yourIndex = q.answers?.[yourPlayerId];
  const correctText = q.options[q.correctIndex];
  const pickedWrong =
    yourIndex != null && yourIndex >= 0 && yourIndex !== q.correctIndex;
  const missed = yourIndex === -1 || yourIndex === undefined;

  return (
    <article key={q.id} className={classes.reviewItem}>
      <p className={classes.reviewQuestion}>
        {index + 1}. {q.text}
      </p>
      <div className={classes.answerCompare}>
        <span className={classes.correct}>✅ {correctText}</span>
        {pickedWrong ? (
          <span className={classes.wrong}>❌ {q.options[yourIndex]}</span>
        ) : null}
        {missed ? (
          <span className={classes.wrong}>❌ Pas de réponse</span>
        ) : null}
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
  const total = rankings.length;

  const [revealedCount, setRevealedCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const listRef = useRef(null);
  const prevPositionsRef = useRef(new Map());
  const skipFlipRef = useRef(true);

  const rankingsKey = useMemo(
    () => rankings.map((entry) => `${entry.playerId}:${entry.score}`).join("|"),
    [rankings]
  );

  const visibleEntries = useMemo(
    () => rankings.slice(Math.max(0, total - revealedCount)),
    [rankings, total, revealedCount]
  );

  const latestRevealedId = visibleEntries[0]?.playerId ?? null;

  useEffect(() => {
    setRevealedCount(0);
    setShowCelebration(false);
    setShowDetails(false);
    skipFlipRef.current = true;
    prevPositionsRef.current = new Map();
  }, [rankingsKey]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const items = list.querySelectorAll("[data-podium-item]");
    const nextPositions = new Map();

    items.forEach((item) => {
      const id = item.getAttribute("data-podium-item");
      if (id) nextPositions.set(id, item.getBoundingClientRect().top);
    });

    if (skipFlipRef.current) {
      skipFlipRef.current = false;
      prevPositionsRef.current = nextPositions;
      return;
    }

    items.forEach((item) => {
      const id = item.getAttribute("data-podium-item");
      if (!id) return;

      const prevTop = prevPositionsRef.current.get(id);
      const nextTop = nextPositions.get(id);
      if (prevTop == null || nextTop == null) return;

      const delta = prevTop - nextTop;
      if (Math.abs(delta) < 1) return;

      item.style.transition = "none";
      item.style.transform = `translateY(${delta}px)`;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          item.style.transition = SLIDE_TRANSITION;
          item.style.transform = "";
        });
      });
    });

    prevPositionsRef.current = nextPositions;
  }, [visibleEntries, revealedCount]);

  useEffect(() => {
    if (!total) {
      setShowDetails(true);
      return undefined;
    }

    if (revealedCount >= total) {
      const celebrationTimer = window.setTimeout(() => {
        setShowCelebration(true);
      }, CELEBRATION_DELAY_MS);

      const detailsTimer = window.setTimeout(() => {
        setShowDetails(true);
      }, CELEBRATION_DELAY_MS + 800);

      return () => {
        window.clearTimeout(celebrationTimer);
        window.clearTimeout(detailsTimer);
      };
    }

    const revealTimer = window.setTimeout(() => {
      setRevealedCount((count) => count + 1);
    }, REVEAL_DELAY_MS);

    return () => window.clearTimeout(revealTimer);
  }, [revealedCount, total]);

  return (
    <section className={classes.stage}>
      <div className={classes.backdrop} aria-hidden="true">
        <span className={classes.glow} />
        {showCelebration ? (
          <>
            <span className={`${classes.confetti} ${classes.confettiA}`} />
            <span className={`${classes.confetti} ${classes.confettiB}`} />
            <span className={`${classes.confetti} ${classes.confettiC}`} />
            <span className={`${classes.confetti} ${classes.confettiD}`} />
          </>
        ) : null}
      </div>

      <div className={classes.content}>
        <header className={classes.intro}>
          <p className={classes.eyebrow}>{t.matchEnded}</p>
          <h2 className={classes.title}>{t.andTheWinnerIs}</h2>
        </header>

        <ol ref={listRef} className={classes.podium} aria-label="Révélation du classement">
          {visibleEntries.map((entry) => {
            const rank = rankings.findIndex((item) => item.playerId === entry.playerId) + 1;
            const isWinner = rank === 1;
            const isYou = entry.playerId === yourPlayerId;
            const justRevealed = entry.playerId === latestRevealedId;
            const scoreLabel = `${entry.score} pts${result?.maxScore ? ` / ${result.maxScore}` : ""}`;

            return (
              <li
                key={entry.playerId}
                data-podium-item={entry.playerId}
                className={classes.podiumItem}
              >
                {isWinner ? (
                  <div
                    className={[
                      classes.winnerRow,
                      justRevealed ? classes.winnerRowEnter : "",
                      showCelebration ? classes.winnerRowCelebrate : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <TrophyIcon className={classes.trophy} />
                    <div className={classes.winnerBody}>
                      <p className={classes.winnerLabel}>{t.winnerLabel}</p>
                      <h3 className={classes.winnerName}>
                        {entry.name}
                        {isYou ? <span className={classes.youTag}> {t.youTag}</span> : null}
                      </h3>
                      <p className={classes.winnerScore}>{scoreLabel}</p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={[
                      classes.podiumRow,
                      justRevealed ? classes.podiumRowEnter : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className={classes.podiumPlace}>{placeLabel(rank)}</span>
                    <span className={classes.podiumName}>
                      {entry.name}
                      {isYou ? <span className={classes.youTag}> (vous)</span> : null}
                    </span>
                    <span className={classes.podiumScore}>{scoreLabel}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {showDetails ? (
          <div className={classes.details}>
            {questionReview?.length ? (
                  <details className={classes.review}>
                <summary className={classes.reviewSummary}>{t.viewReview}</summary>
                <div className={classes.reviewBody}>
                  {questionReview.map((q, index) =>
                    renderReviewItem(q, index, { yourPlayerId, classes })
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
        ) : null}
      </div>
    </section>
  );
}
