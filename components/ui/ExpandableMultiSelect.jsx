"use client";

import { useEffect, useId, useRef, useState } from "react";
import classes from "./ExpandableMultiSelect.module.css";

function Chevron({ open }) {
  return (
    <svg
      className={`${classes.chevron} ${open ? classes.chevronOpen : ""}`}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M3.2 6.2a.75.75 0 0 1 1.06 0L8 9.94l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L3.2 7.26a.75.75 0 0 1 0-1.06z"
      />
    </svg>
  );
}

function summarizeSelection(selectedOptions, placeholder) {
  if (!selectedOptions.length) return placeholder;
  if (selectedOptions.length === 1) return selectedOptions[0].label;
  if (selectedOptions.length === 2) {
    return `${selectedOptions[0].label}, ${selectedOptions[1].label}`;
  }
  return `${selectedOptions[0].label} +${selectedOptions.length - 1}`;
}

export default function ExpandableMultiSelect({
  value = [],
  options = [],
  onChange,
  placeholder = "Select…",
  disabled = false,
  id,
  ariaLabel,
  expandDirection = "down",
  showSelectAll = true,
  showClear = true,
  selectAllLabel = "All",
  clearLabel = "Clear",
  renderOption,
}) {
  const generatedId = useId();
  const rootId = id ?? generatedId;
  const panelId = `${rootId}-panel`;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedValues = Array.isArray(value) ? value : [];
  const selectedSet = new Set(selectedValues);
  const selectedOptions = options.filter((option) =>
    selectedSet.has(option.value)
  );
  const triggerLabel = summarizeSelection(selectedOptions, placeholder);
  const expandUp = expandDirection === "up";

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        document.getElementById(rootId)?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, rootId]);

  const emit = (next) => {
    if (typeof onChange === "function") onChange(next);
  };

  const toggleValue = (optionValue, event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (disabled) return;
    const next = selectedSet.has(optionValue)
      ? selectedValues.filter((entry) => entry !== optionValue)
      : [...selectedValues, optionValue];
    emit(next);
  };

  const selectAll = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (disabled) return;
    emit(options.map((option) => option.value));
  };

  const clearAll = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (disabled) return;
    emit([]);
  };

  return (
    <div
      className={`${classes.root} ${open ? classes.rootOpen : ""}`.trim()}
      ref={rootRef}
    >
      <div
        className={`${classes.shell} ${expandUp ? classes.shellUp : ""}`.trim()}
      >
        <button
          type="button"
          id={rootId}
          className={classes.trigger}
          aria-expanded={open}
          aria-controls={panelId}
          aria-haspopup="listbox"
          aria-label={ariaLabel ?? placeholder}
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className={classes.triggerLabel}>{triggerLabel}</span>
          <Chevron open={open} />
        </button>

        <div
          id={panelId}
          className={`${classes.panel} ${open ? classes.panelOpen : ""}`}
          aria-hidden={!open}
        >
          <div className={classes.panelInner}>
            {showSelectAll || showClear ? (
              <div className={classes.toolbar}>
                {showSelectAll ? (
                  <button
                    type="button"
                    className={classes.toolBtn}
                    tabIndex={open ? 0 : -1}
                    disabled={disabled || selectedSet.size === options.length}
                    onClick={selectAll}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    {selectAllLabel}
                  </button>
                ) : null}
                {showClear ? (
                  <button
                    type="button"
                    className={classes.toolBtn}
                    tabIndex={open ? 0 : -1}
                    disabled={disabled || selectedSet.size === 0}
                    onClick={clearAll}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    {clearLabel}
                  </button>
                ) : null}
              </div>
            ) : null}

            <div
              className={classes.grid}
              role="listbox"
              aria-multiselectable="true"
              aria-labelledby={rootId}
            >
              {options.map((option) => {
                const isSelected = selectedSet.has(option.value);
                const tileClass = [
                  classes.tile,
                  isSelected ? classes.tileSelected : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={option.value || "empty"}
                    type="button"
                    id={`${rootId}-option-${option.value}`}
                    role="option"
                    aria-selected={isSelected}
                    className={tileClass}
                    tabIndex={open ? 0 : -1}
                    disabled={disabled}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => toggleValue(option.value, event)}
                  >
                    {typeof renderOption === "function" ? (
                      renderOption(option, isSelected)
                    ) : (
                      <>
                        {option.icon ? (
                          <span className={classes.tileIcon} aria-hidden="true">
                            {option.icon}
                          </span>
                        ) : null}
                        <span className={classes.tileLabel}>{option.label}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
