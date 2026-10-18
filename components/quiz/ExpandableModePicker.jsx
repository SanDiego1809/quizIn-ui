"use client";

import { useEffect, useId, useRef, useState } from "react";
import classes from "./ExpandableModePicker.module.css";

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

export default function ExpandableModePicker({
  value,
  options = [],
  onChange,
  placeholder = "Choose mode",
  disabled = false,
  id,
  ariaLabel,
  theme = {},
}) {
  const generatedId = useId();
  const rootId = id ?? generatedId;
  const panelId = `${rootId}-panel`;
  const listId = `${rootId}-list`;
  const rootRef = useRef(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = options.find((option) => option.value === value);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const triggerLabel = selected?.label ?? placeholder;
  const activeOption = activeIndex >= 0 ? options[activeIndex] : selected;
  const selectedTheme = selected ? theme[selected.value] ?? {} : {};
  const SelectedIcon =
    typeof selectedTheme.Icon === "function"
      ? selectedTheme.Icon
      : null;

  useEffect(() => {
    if (!open) return undefined;

    const currentOptions = optionsRef.current;
    const initial =
      selectedIndex >= 0
        ? selectedIndex
        : currentOptions.length > 0
          ? 0
          : -1;
    setActiveIndex(initial);

    const focusOption = (index) => {
      if (index < 0) return;
      const option = optionsRef.current[index];
      if (!option) return;
      const node = document.getElementById(
        `${rootId}-option-${option.value}`
      );
      node?.focus();
    };

    const frame = window.requestAnimationFrame(() => focusOption(initial));

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
        return;
      }

      const list = optionsRef.current;
      if (!list.length) return;

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((prev) => {
          const base = prev >= 0 ? prev : 0;
          const next = (base + 1) % list.length;
          focusOption(next);
          return next;
        });
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((prev) => {
          const base = prev >= 0 ? prev : 0;
          const next = (base - 1 + list.length) % list.length;
          focusOption(next);
          return next;
        });
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(0);
        focusOption(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        const last = list.length - 1;
        setActiveIndex(last);
        focusOption(last);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, rootId, selectedIndex]);

  const selectOption = (nextValue) => {
    if (typeof onChange === "function") {
      onChange(nextValue);
    }
    setOpen(false);
  };

  return (
    <div className={classes.root} ref={rootRef}>
      <div className={classes.shell}>
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
          {SelectedIcon ? (
            <span className={classes.triggerIcon} aria-hidden="true">
              <SelectedIcon />
            </span>
          ) : null}
          <span className={classes.triggerLabel}>{triggerLabel}</span>
          <Chevron open={open} />
        </button>

        <div
          id={panelId}
          className={`${classes.panel} ${open ? classes.panelOpen : ""}`}
          aria-hidden={!open}
        >
          <div className={classes.panelInner}>
            <div
              id={listId}
              className={classes.grid}
              role="listbox"
              aria-labelledby={rootId}
              aria-activedescendant={
                open && activeOption
                  ? `${rootId}-option-${activeOption.value}`
                  : undefined
              }
            >
              {options.map((option, index) => {
                const entry = theme[option.value] ?? {};
                const isSelected = option.value === value;
                const TileIcon =
                  typeof entry.Icon === "function"
                    ? entry.Icon
                    : null;
                const tileClass = [
                  classes.tile,
                  entry.className ?? classes.defaultTile,
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
                    tabIndex={open && index === activeIndex ? 0 : -1}
                    onClick={() => selectOption(option.value)}
                    onFocus={() => setActiveIndex(index)}
                  >
                    {TileIcon ? (
                      <span className={classes.tileIcon} aria-hidden="true">
                        <TileIcon />
                      </span>
                    ) : entry.icon ? (
                      <span className={classes.tileIcon} aria-hidden="true">
                        {entry.icon}
                      </span>
                    ) : null}
                    <span className={classes.tileLabel}>{option.label}</span>
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
