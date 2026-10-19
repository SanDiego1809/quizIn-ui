"use client";

import { useEffect, useId, useRef, useState } from "react";
import classes from "./SettingInfoTip.module.css";

export default function SettingInfoTip({ text, label = "More info" }) {
  const tipId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!text) return null;

  return (
    <span className={classes.root} ref={rootRef}>
      <button
        type="button"
        className={classes.button}
        aria-label={label}
        aria-expanded={open}
        aria-controls={tipId}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        i
      </button>
      {open ? (
        <span id={tipId} role="tooltip" className={classes.tip}>
          {text}
        </span>
      ) : null}
    </span>
  );
}
