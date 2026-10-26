"use client";

import { useEffect, useRef, useState } from "react";
import RoleIcon from "./RoleIcon";
import classes from "./MysteryCard.module.css";

export default function MysteryCard({
  player,
  alive = true,
  revealedRole = null,
  isYou = false,
  isTurn = false,
  isNominee = false,
  selected = false,
  interactive = false,
  score = 0,
  clue = null,
  roleLabelText = "",
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
}) {
  const [revealing, setRevealing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [ghost, setGhost] = useState(null);
  const seenRevealRef = useRef(Boolean(revealedRole));
  const pointerIdRef = useRef(null);
  const startRef = useRef(null);
  const movedRef = useRef(false);

  useEffect(() => {
    if (!revealedRole) {
      seenRevealRef.current = false;
      return undefined;
    }
    if (seenRevealRef.current) return undefined;
    seenRevealRef.current = true;
    setRevealing(true);
    const id = setTimeout(() => setRevealing(false), 720);
    return () => clearTimeout(id);
  }, [revealedRole]);

  const dead = !alive || Boolean(revealedRole);
  const showRole = Boolean(revealedRole);

  function finishDrag(clientX, clientY) {
    setDragging(false);
    setGhost(null);
    pointerIdRef.current = null;
    onDragEnd?.({
      playerId: player.id,
      clientX,
      clientY,
      moved: movedRef.current,
    });
    movedRef.current = false;
    startRef.current = null;
  }

  function handlePointerDown(event) {
    if (!interactive) return;
    if (event.button != null && event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointerIdRef.current = event.pointerId;
    startRef.current = { x: event.clientX, y: event.clientY };
    movedRef.current = false;
    setDragging(true);
    setGhost({ x: event.clientX, y: event.clientY });
    onDragStart?.({ playerId: player.id });
  }

  function handlePointerMove(event) {
    if (pointerIdRef.current !== event.pointerId) return;
    const start = startRef.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.hypot(dx, dy) > 8) movedRef.current = true;
    setGhost({ x: event.clientX, y: event.clientY });
    onDragMove?.({
      playerId: player.id,
      clientX: event.clientX,
      clientY: event.clientY,
    });
  }

  function handlePointerUp(event) {
    if (pointerIdRef.current !== event.pointerId) return;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
    const moved = movedRef.current;
    finishDrag(event.clientX, event.clientY);
    if (!moved) onSelect?.(player.id);
  }

  function handlePointerCancel(event) {
    if (pointerIdRef.current !== event.pointerId) return;
    finishDrag(event.clientX, event.clientY);
  }

  function handleKeyDown(event) {
    if (!interactive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect?.(player.id);
    }
  }

  const faceClass = [classes.face, revealing ? classes.revealing : ""]
    .filter(Boolean)
    .join(" ");

  const rootClass = [
    classes.card,
    interactive ? classes.cardInteractive : "",
    selected ? classes.cardSelected : "",
    dragging ? classes.cardDragging : "",
    isYou ? classes.cardYou : "",
    isTurn ? classes.cardTurn : "",
    isNominee ? classes.cardNominee : "",
    dead ? classes.cardDead : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes.wrap}>
      <span className={classes.boardPin} aria-hidden="true">
        <span className={classes.boardPinHead} />
        <span className={classes.boardPinNeedle} />
      </span>
      <div
        className={rootClass}
        role={interactive ? "button" : "group"}
        tabIndex={interactive ? 0 : undefined}
        aria-pressed={interactive ? selected : undefined}
        aria-label={`${player.name}${
          showRole && roleLabelText ? `, ${roleLabelText}` : ""
        }${dead ? ", eliminated" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handleKeyDown}
      >
        <div className={faceClass}>
          <div className={classes.inner}>
            <span
              className={`${classes.artWrap}${
                showRole ? "" : ` ${classes.mysteryArt}`
              }`}
            >
              <RoleIcon
                role={showRole ? revealedRole : "mystery"}
                size="lg"
                title={showRole ? roleLabelText : undefined}
              />
            </span>
            {showRole && roleLabelText ? (
              <span className={classes.badge}>{roleLabelText}</span>
            ) : null}
            <span className={classes.veil} />
          </div>
        </div>
        <div className={classes.meta}>
          {clue ? (
            <span className={classes.clue} title={clue}>
              {clue}
            </span>
          ) : null}
          <span className={classes.name}>{player.name}</span>
          <span className={classes.score}>{score}</span>
        </div>
      </div>
      {dragging && ghost ? (
        <div
          className={classes.ghost}
          style={{ left: ghost.x, top: ghost.y }}
          aria-hidden="true"
        >
          <div className={faceClass}>
            <div className={classes.inner}>
              <span className={classes.artWrap}>
                <RoleIcon role="mystery" size="md" />
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
