"use client";

import MysteryCard from "./MysteryCard";
import classes from "./PlayerTable.module.css";

export default function PlayerTable({
  players = [],
  aliveSet,
  revealedRolesByPlayerId = {},
  yourPlayerId = null,
  activeCluePlayerId = null,
  accuseNomineeId = null,
  playerScores = {},
  clues = {},
  subPhase = null,
  selectedId = null,
  interactiveIds = null,
  roleLabelFn,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
}) {
  const interactive =
    interactiveIds instanceof Set ? interactiveIds : new Set(interactiveIds || []);
  const showClues =
    subPhase === "clue" ||
    subPhase === "discuss" ||
    subPhase === "accuse" ||
    subPhase === "vote" ||
    subPhase === "mrwhite_guess" ||
    subPhase === "round_results";

  return (
    <div className={classes.cards} aria-label="Players">
      {players.map((player) => {
        const alive = aliveSet?.has?.(player.id) ?? true;
        const revealedRole = revealedRolesByPlayerId?.[player.id] || null;
        const canInteract = interactive.has(player.id);
        const clueText = showClues ? clues?.[player.id] : null;
        return (
          <MysteryCard
            key={player.id}
            player={player}
            alive={alive}
            revealedRole={revealedRole}
            isYou={player.id === yourPlayerId}
            isTurn={subPhase === "clue" && player.id === activeCluePlayerId}
            isNominee={player.id === accuseNomineeId}
            selected={selectedId === player.id}
            interactive={canInteract}
            score={playerScores?.[player.id] ?? 0}
            clue={clueText || null}
            roleLabelText={
              revealedRole && roleLabelFn ? roleLabelFn(revealedRole) : ""
            }
            onSelect={onSelect}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
          />
        );
      })}
    </div>
  );
}
