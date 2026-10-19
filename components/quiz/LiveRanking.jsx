"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import classes from "./LiveRanking.module.css";

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

/**
 * Live scoreboard for quiz rounds.
 * On reveal: counts up awarded points and FLIP-animates rank swaps.
 * @param {"default"|"classic"} variant — classic keeps ranking top-left on mobile
 *   so it does not collide with the avatar strip above the question bar.
 */
export default function LiveRanking({
  players = [],
  scores = {},
  yourPlayerId = null,
  eliminatedPlayerIds = [],
  phase = "playing",
  label = "Ranking",
  youLabel = "you",
  variant = "default",
  showEliminated = true,
}) {
  const eliminated = useMemo(
    () => new Set(eliminatedPlayerIds || []),
    [eliminatedPlayerIds]
  );

  const targetEntries = useMemo(
    () =>
      sortEntries(
        players.map((player) => ({
          playerId: player.id,
          name: player.name || "Player",
          score: Number(scores?.[player.id]) || 0,
          eliminated: eliminated.has(player.id),
        }))
      ),
    [players, scores, eliminated]
  );

  const [displayScores, setDisplayScores] = useState(() =>
    Object.fromEntries(targetEntries.map((e) => [e.playerId, e.score]))
  );
  const [deltas, setDeltas] = useState({});
  const [overtakenIds, setOvertakenIds] = useState(() => new Set());
  const prevTargetsRef = useRef({});
  const prevOrderRef = useRef(targetEntries.map((e) => e.playerId));
  const rowRefs = useRef(new Map());
  const listRef = useRef(null);
  const animFrameRef = useRef(0);

  const scoresKey = useMemo(
    () => targetEntries.map((e) => `${e.playerId}:${e.score}`).join("|"),
    [targetEntries]
  );

  const displayEntries = useMemo(
    () =>
      sortEntries(
        targetEntries.map((entry) => ({
          ...entry,
          score: displayScores[entry.playerId] ?? entry.score,
        }))
      ),
    [targetEntries, displayScores]
  );

  // When server scores jump (reveal), animate count-up + capture deltas.
  useEffect(() => {
    const prev = prevTargetsRef.current;
    const nextDeltas = {};
    let changed = false;

    for (const entry of targetEntries) {
      const before = prev[entry.playerId];
      if (typeof before === "number" && entry.score > before) {
        nextDeltas[entry.playerId] = entry.score - before;
        changed = true;
      }
    }

    const snapshotTargets = Object.fromEntries(
      targetEntries.map((e) => [e.playerId, e.score])
    );
    prevTargetsRef.current = snapshotTargets;

    if (!changed || phase !== "reveal") {
      setDisplayScores(snapshotTargets);
      return undefined;
    }

    setDeltas(nextDeltas);
    const from = { ...prev };
    for (const entry of targetEntries) {
      if (from[entry.playerId] == null) from[entry.playerId] = 0;
    }

    const duration = 700;
    const started = performance.now();
    cancelAnimationFrame(animFrameRef.current);

    const tick = (now) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = easeOutCubic(t);
      const next = {};
      for (const entry of targetEntries) {
        const start = from[entry.playerId] ?? entry.score;
        next[entry.playerId] = Math.round(
          start + (entry.score - start) * eased
        );
      }
      setDisplayScores(next);
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setDeltas({}), 900);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
    // scoresKey captures target score identity; targetEntries read from closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoresKey, phase]);

  // FLIP reorder when display order changes (overtakes).
  useLayoutEffect(() => {
    const nextOrder = displayEntries.map((e) => e.playerId);
    const prevOrder = prevOrderRef.current;
    const firstRects = new Map();

    for (const id of prevOrder) {
      const node = rowRefs.current.get(id);
      if (node) firstRects.set(id, node.getBoundingClientRect());
    }

    const swapped = new Set();
    for (let i = 0; i < nextOrder.length; i += 1) {
      const id = nextOrder[i];
      const prevIndex = prevOrder.indexOf(id);
      if (prevIndex >= 0 && prevIndex > i) {
        swapped.add(id);
      }
    }

    prevOrderRef.current = nextOrder;

    for (const id of nextOrder) {
      const node = rowRefs.current.get(id);
      const first = firstRects.get(id);
      if (!node || !first) continue;
      const last = node.getBoundingClientRect();
      const dy = first.top - last.top;
      if (Math.abs(dy) < 1) continue;
      node.animate(
        [
          { transform: `translateY(${dy}px)` },
          { transform: "translateY(0)" },
        ],
        {
          duration: 480,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        }
      );
    }

    if (swapped.size) {
      setOvertakenIds(swapped);
      const clear = window.setTimeout(() => setOvertakenIds(new Set()), 1100);
      return () => window.clearTimeout(clear);
    }
    return undefined;
  }, [displayEntries]);

  if (!displayEntries.length) return null;

  const rootClass = [
    classes.root,
    variant === "classic" ? classes.rootClassic : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={rootClass} aria-label={label}>
      <p className={classes.heading}>{label}</p>
      <ol className={classes.list} ref={listRef}>
        {displayEntries.map((entry, index) => {
          const isYou = entry.playerId === yourPlayerId;
          const delta = deltas[entry.playerId] || 0;
          const rowClass = [
            classes.row,
            isYou ? classes.rowYou : "",
            showEliminated && entry.eliminated ? classes.rowOut : "",
            overtakenIds.has(entry.playerId) ? classes.rowOvertake : "",
            delta > 0 ? classes.rowGain : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <li
              key={entry.playerId}
              className={rowClass}
              ref={(node) => {
                if (node) rowRefs.current.set(entry.playerId, node);
                else rowRefs.current.delete(entry.playerId);
              }}
            >
              <span className={classes.rank}>{index + 1}</span>
              <span className={classes.name}>
                {entry.name}
                {isYou ? (
                  <span className={classes.youTag}>{youLabel}</span>
                ) : null}
                {showEliminated && entry.eliminated ? (
                  <span className={classes.outTag}>out</span>
                ) : null}
              </span>
              <span className={classes.scoreWrap}>
                {delta > 0 ? (
                  <span className={classes.delta} aria-hidden="true">
                    +{delta}
                  </span>
                ) : null}
                <span className={classes.score}>{entry.score}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
