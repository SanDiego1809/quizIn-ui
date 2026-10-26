"use client";

import { forwardRef } from "react";
import classes from "./EliminateZone.module.css";

function BinIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 16h24l-2 24H14L12 16z"
        fill="currentColor"
        opacity="0.35"
      />
      <path
        d="M10 16h28M18 16V12h12v4M20 22v12M24 22v12M28 22v12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const EliminateZone = forwardRef(function EliminateZone(
  {
    mode = "eliminate",
    label,
    hint,
    selectedName = null,
    confirmLabel,
    hot = false,
    disabled = false,
    onConfirm,
    onKeyActivate,
  },
  ref
) {
  const ready = Boolean(selectedName) && !disabled;

  return (
    <div
      ref={ref}
      className={`${classes.zone}${hot ? ` ${classes.zoneHot}` : ""}${
        ready ? ` ${classes.zoneReady}` : ""
      }`}
      role="region"
      aria-label={label}
      tabIndex={ready ? 0 : -1}
      onKeyDown={(event) => {
        if (!ready) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onKeyActivate?.();
          onConfirm?.();
        }
      }}
      onClick={() => {
        if (!ready) return;
        onConfirm?.();
      }}
    >
      <div className={classes.header}>
        <BinIcon className={classes.icon} />
        <div className={classes.labelBlock}>
          <p className={classes.label}>{label}</p>
          <p className={classes.hint}>{hint}</p>
          {selectedName ? (
            <p className={classes.selected}>
              {mode === "nominate" ? "→ " : "× "}
              {selectedName}
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        className={classes.confirm}
        disabled={!ready}
        onClick={(event) => {
          event.stopPropagation();
          onConfirm?.();
        }}
      >
        {confirmLabel}
      </button>
    </div>
  );
});

export default EliminateZone;

export function pointInRect(clientX, clientY, el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return (
    clientX >= r.left &&
    clientX <= r.right &&
    clientY >= r.top &&
    clientY <= r.bottom
  );
}
