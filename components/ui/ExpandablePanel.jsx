"use client";

import { useId, useState } from "react";
import classes from "./ExpandablePanel.module.css";

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

/**
 * Click-to-expand panel — same trigger/chevron pattern as ExpandableMultiSelect.
 * Pass `open` + `onOpenChange` for controlled / accordion use.
 */
export default function ExpandablePanel({
  title,
  summary = null,
  icon = null,
  children,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  className = "",
  id,
}) {
  const generatedId = useId();
  const rootId = id ?? generatedId;
  const panelId = `${rootId}-panel`;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolledOpen;

  const setOpen = (next) => {
    if (!controlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div
      className={`${classes.root}${open ? ` ${classes.rootOpen}` : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      <div className={classes.shell}>
        <button
          type="button"
          id={rootId}
          className={classes.trigger}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          {icon ? (
            <span
              className={`${classes.iconSlot}${
                open ? ` ${classes.iconSlotOpen}` : ""
              }`}
              aria-hidden="true"
            >
              {icon}
            </span>
          ) : null}
          <span className={classes.triggerText}>
            <span className={classes.triggerTitle}>{title}</span>
            {!open && summary ? (
              <span className={classes.triggerSummary}>{summary}</span>
            ) : null}
          </span>
          <Chevron open={open} />
        </button>

        <div
          id={panelId}
          className={`${classes.panel}${open ? ` ${classes.panelOpen}` : ""}`}
          aria-hidden={!open}
        >
          <div className={classes.panelInner}>
            <div className={classes.panelContent}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
