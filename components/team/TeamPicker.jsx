"use client";

import { useEffect, useState } from "react";
import classes from "./TeamPicker.module.css";

function PersonIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="8" r="3.5" fill="currentColor" />
      <path
        d="M5.5 19.2c.8-3.4 3.2-5.2 6.5-5.2s5.7 1.8 6.5 5.2c.1.4-.2.8-.6.8H6.1c-.4 0-.7-.4-.6-.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TeamSide({
  teamKey,
  label,
  players,
  yourPlayerId,
  selected,
  popping,
  onPick,
  emptyLabel,
}) {
  return (
    <button
      type="button"
      className={[
        classes.side,
        classes[teamKey],
        selected ? classes.sideSelected : "",
        popping ? classes.sidePop : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onPick?.(teamKey)}
      disabled={typeof onPick !== "function"}
      aria-pressed={selected}
    >
      <span className={classes.sideHeader}>
        <span className={classes.sideName}>{label}</span>
        <span className={classes.sideCount}>{players.length}</span>
      </span>

      <span className={classes.roster} aria-label={`${label} roster`}>
        {players.length ? (
          players.map((player) => {
            const isYou = player.id === yourPlayerId;
            return (
              <span
                key={player.id}
                className={[
                  classes.person,
                  isYou ? classes.personYou : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                title={player.name}
              >
                <PersonIcon className={classes.personIcon} />
                <span className={classes.personName}>
                  {isYou ? `${player.name} ★` : player.name}
                </span>
              </span>
            );
          })
        ) : (
          <span className={classes.emptySlot}>
            <PersonIcon className={classes.emptyIcon} />
            <span>{emptyLabel}</span>
          </span>
        )}
      </span>
    </button>
  );
}

export default function TeamPicker({
  players,
  yourPlayerId,
  yourTeamKey,
  onPickTeam,
  labels,
}) {
  const [popTeam, setPopTeam] = useState(null);

  useEffect(() => {
    if (!popTeam) return undefined;
    const id = window.setTimeout(() => setPopTeam(null), 420);
    return () => window.clearTimeout(id);
  }, [popTeam]);

  function handlePick(teamKey) {
    setPopTeam(teamKey);
    onPickTeam?.(teamKey);
  }

  const bluePlayers = players.filter((player) => player.teamKey === "blue");
  const redPlayers = players.filter((player) => player.teamKey === "red");

  return (
    <div className={classes.board}>
      <p className={classes.label}>{labels.pickYourTeam}</p>
      <div className={classes.lanes}>
        <TeamSide
          teamKey="blue"
          label={labels.teamBlue}
          players={bluePlayers}
          yourPlayerId={yourPlayerId}
          selected={yourTeamKey === "blue"}
          popping={popTeam === "blue"}
          onPick={handlePick}
          emptyLabel={labels.joinTeam}
        />
        <div className={classes.versus} aria-hidden="true">
          <span>VS</span>
        </div>
        <TeamSide
          teamKey="red"
          label={labels.teamRed}
          players={redPlayers}
          yourPlayerId={yourPlayerId}
          selected={yourTeamKey === "red"}
          popping={popTeam === "red"}
          onPick={handlePick}
          emptyLabel={labels.joinTeam}
        />
      </div>
    </div>
  );
}
