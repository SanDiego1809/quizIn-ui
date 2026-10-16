"use client";

import classes from "./NumberStepper.module.css";

function clamp(value, min, max) {
  let next = value;
  if (Number.isFinite(min) && next < min) next = min;
  if (Number.isFinite(max) && next > max) next = max;
  return next;
}

export default function NumberStepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className = "",
}) {
  const numeric = Number(value);
  const current = Number.isFinite(numeric) ? numeric : Number(min) || 0;
  const stepSize = Number(step) || 1;

  const atMin = Number.isFinite(min) && current <= min;
  const atMax = Number.isFinite(max) && current >= max;

  function commit(next) {
    if (disabled || typeof onChange !== "function") return;
    onChange(clamp(next, min, max));
  }

  function onInputChange(event) {
    const raw = event.target.value;
    if (raw === "" || raw === "-") return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    commit(parsed);
  }

  return (
    <div className={`${classes.stepper} ${className}`.trim()}>
      <button
        type="button"
        className={classes.btn}
        onClick={() => commit(current - stepSize)}
        disabled={disabled || atMin}
        aria-label="Decrease"
        tabIndex={-1}
      >
        <span className={classes.glyph} aria-hidden="true">
          −
        </span>
      </button>
      <input
        id={id}
        className={classes.value}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={stepSize}
        value={Number.isFinite(numeric) ? numeric : ""}
        disabled={disabled}
        onChange={onInputChange}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
      />
      <button
        type="button"
        className={classes.btn}
        onClick={() => commit(current + stepSize)}
        disabled={disabled || atMax}
        aria-label="Increase"
        tabIndex={-1}
      >
        <span className={classes.glyph} aria-hidden="true">
          +
        </span>
      </button>
    </div>
  );
}
