"use client";

import { DEFAULT_SKIN, getSkin } from "@/lib/quiz/cosmetics";
import classes from "./ContestantRow.module.css";

function skinAccent(skinKey) {
  const skin = getSkin(skinKey ?? DEFAULT_SKIN);
  if (skin?.color != null) {
    const hex = skin.color.toString(16).padStart(6, "0");
    return `#${hex}`;
  }
  return "#38bdf8";
}

export default function ContestantRow({
  players = [],
  maxSeats = 4,
  yourPlayerId = null,
  hostTag = "host",
  emptyLabel = "Empty seat",
  youLabel = "you",
  pulpitKit = "gold",
}) {
  const seats = Array.from(
    { length: Math.max(maxSeats, players.length) },
    (_, i) => players[i] ?? null
  );

  return (
    <ul className={classes.row} aria-label="Contestants">
      {seats.map((player, index) => {
        const filled = Boolean(player);
        const isYou = player?.id === yourPlayerId;
        const accent = filled ? skinAccent(player.skinKey) : null;
        return (
          <li
            key={player?.id ?? `empty-${index}`}
            className={`${classes.seat} ${filled ? classes.lit : classes.dim} ${classes[`kit_${pulpitKit}`] || classes.kit_gold}`}
          >
            <div className={classes.light} aria-hidden="true" />
            <div className={classes.pulpit}>
              <div
                className={classes.screen}
                style={accent ? { "--seat-accent": accent } : undefined}
                aria-hidden="true"
              />
              {filled ? (
                <div
                  className={classes.avatarSilhouette}
                  style={{ background: `linear-gradient(180deg, ${accent}aa, ${accent}33)` }}
                  aria-hidden="true"
                />
              ) : (
                <div className={classes.silhouette} aria-hidden="true" />
              )}
              <div className={classes.desk} aria-hidden="true" />
            </div>
            <div className={classes.nameplate}>
              {filled ? (
                <>
                  <span className={classes.name}>
                    {player.name}
                    {isYou ? ` · ${youLabel}` : ""}
                  </span>
                  {player.isHost ? (
                    <span className={classes.host}>{hostTag}</span>
                  ) : null}
                  {player.plan === "premium" ? (
                    <span className={classes.premium}>Premium</span>
                  ) : null}
                </>
              ) : (
                <span className={classes.empty}>{emptyLabel}</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
