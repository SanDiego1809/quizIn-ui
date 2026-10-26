"use client";

import RoleIcon from "./RoleIcon";
import classes from "./DetectiveBoard.module.css";

function stampClass(winner) {
  if (winner === "civilians") return classes.stampCivilians;
  if (winner === "undercover") return classes.stampUndercover;
  if (winner === "mr_white") return classes.stampMrWhite;
  return classes.stampCivilians;
}

function winnerRole(winner) {
  if (winner === "civilians") return "civilian";
  if (winner === "undercover") return "undercover";
  if (winner === "mr_white") return "mr_white";
  return "mystery";
}

export default function DetectiveBoard({
  children,
  topSlot = null,
  bottomSlot = null,
  result = null,
  roleCounts = null,
  clueEntries = [],
  phaseTitleText = "",
  roundMetaText = "",
  winnerText = "",
  eliminatedLabel = "Out",
  wordCivilianLabel = "Civilian",
  wordUndercoverLabel = "Undercover",
  guessLabel = "Guess",
  correctLabel = "✓",
  wrongLabel = "✗",
  scoreCivilians = "Civilians",
  scoreUndercover = "Undercover",
  scoreMrWhite = "Mr White",
  cluesDockLabel = "Clues",
  nextLabel = "Next",
  lobbyLabel = "Lobby",
  caseLabel = "Case board",
  waitingHostLabel = "Waiting for the host…",
  isHost = false,
  onNext,
  onLobby,
}) {
  const showResults = Boolean(result);
  const eliminatedRole = result?.eliminatedRole || null;
  const counts = roleCounts || {
    civilians: 0,
    undercover: 0,
    mr_white: 0,
  };
  const clues = Array.isArray(clueEntries) ? clueEntries : [];

  return (
    <section
      className={`${classes.board}${
        showResults ? ` ${classes.boardResults}` : ""
      }${clues.length > 0 ? ` ${classes.boardWithClues}` : ""}`}
      aria-label={showResults ? "Round results" : caseLabel}
    >
      <header className={classes.caseHeader}>
        <div className={classes.caseTitles}>
          <p className={classes.caseTag}>{caseLabel}</p>
          {phaseTitleText ? (
            <h2 className={classes.phaseOnBoard}>{phaseTitleText}</h2>
          ) : null}
          {roundMetaText ? (
            <p className={classes.roundOnBoard}>{roundMetaText}</p>
          ) : null}
        </div>
        {showResults ? (
          <div className={classes.header}>
            <div className={`${classes.stamp} ${stampClass(result?.winner)}`}>
              <RoleIcon role={winnerRole(result?.winner)} size="sm" />
              <span>{winnerText}</span>
            </div>
            {result?.eliminatedPlayerName ? (
              <div className={classes.elimPin}>
                <span className={classes.elimX} aria-hidden="true" />
                <RoleIcon role={eliminatedRole || "mystery"} size="sm" />
                <div className={classes.elimMeta}>
                  <span className={classes.elimLabel}>{eliminatedLabel}</span>
                  <span className={classes.elimName}>
                    {result.eliminatedPlayerName}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </header>

      {showResults ? (
        <div className={classes.words}>
          <div className={classes.sticky}>
            <span className={classes.tape} aria-hidden="true" />
            <span className={classes.stickyLabel}>
              <RoleIcon role="civilian" size="sm" />
              {wordCivilianLabel}
            </span>
            <p className={classes.stickyWord}>{result?.commonWord || "—"}</p>
          </div>
          <div className={`${classes.sticky} ${classes.stickyAlt}`}>
            <span className={classes.tape} aria-hidden="true" />
            <span className={classes.stickyLabel}>
              <RoleIcon role="undercover" size="sm" />
              {wordUndercoverLabel}
            </span>
            <p className={classes.stickyWord}>
              {result?.undercoverWord || "—"}
            </p>
          </div>
        </div>
      ) : null}

      {showResults && result?.mrWhiteGuess != null ? (
        <div className={classes.guessNote}>
          <RoleIcon role="mr_white" size="sm" />
          <span>
            {guessLabel}: <strong>{result.mrWhiteGuess || "—"}</strong>
          </span>
          <span
            className={
              result.mrWhiteGuessCorrect ? classes.guessOk : classes.guessBad
            }
          >
            {result.mrWhiteGuessCorrect ? correctLabel : wrongLabel}
          </span>
        </div>
      ) : null}

      {!showResults && topSlot ? (
        <div className={classes.topSlot}>{topSlot}</div>
      ) : null}

      <div className={classes.stage}>{children}</div>

      {clues.length > 0 ? (
        <aside className={classes.cluePostIt} aria-label={cluesDockLabel}>
          <span className={classes.clueTape} aria-hidden="true" />
          <p className={classes.clueDockTitle}>{cluesDockLabel}</p>
          <ul className={classes.clueDockList}>
            {clues.map((entry) => (
              <li key={entry.id} className={classes.clueDockItem}>
                {entry.clue}
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      {!showResults && bottomSlot ? (
        <div className={classes.bottomSlot}>{bottomSlot}</div>
      ) : null}

      <div className={classes.factionRow}>
        <span className={classes.factionChip}>
          <RoleIcon role="civilian" size="sm" />
          {scoreCivilians}
          <span className={classes.factionCount}>{counts.civilians ?? 0}</span>
        </span>
        <span className={classes.factionChip}>
          <RoleIcon role="undercover" size="sm" />
          {scoreUndercover}
          <span className={classes.factionCount}>
            {counts.undercover ?? 0}
          </span>
        </span>
        <span className={classes.factionChip}>
          <RoleIcon role="mr_white" size="sm" />
          {scoreMrWhite}
          <span className={classes.factionCount}>{counts.mr_white ?? 0}</span>
        </span>
      </div>

      {showResults && isHost ? (
        <div className={classes.actions}>
          <button type="button" className={classes.btn} onClick={onNext}>
            {nextLabel}
          </button>
          <button type="button" className={classes.btnGhost} onClick={onLobby}>
            {lobbyLabel}
          </button>
        </div>
      ) : null}

      {showResults && !isHost ? (
        <p className={classes.waitingHost}>{waitingHostLabel}</p>
      ) : null}
    </section>
  );
}
