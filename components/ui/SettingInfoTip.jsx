"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import classes from "./SettingInfoTip.module.css";

const TIP_GAP = 8;
const TIP_WIDTH = 256;

export default function SettingInfoTip({ text, label = "More info" }) {
  const tipId = useId();
  const rootRef = useRef(null);
  const tipRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      setCoords(null);
      return undefined;
    }

    const place = () => {
      const button = rootRef.current?.querySelector("button");
      const tip = tipRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const tipHeight = tip?.offsetHeight || 72;
      const tipWidth = Math.min(TIP_WIDTH, window.innerWidth - 16);
      const spaceBelow = window.innerHeight - rect.bottom - TIP_GAP;
      const placeAbove = spaceBelow < tipHeight && rect.top > tipHeight + TIP_GAP;

      let left = rect.right - tipWidth;
      left = Math.max(8, Math.min(left, window.innerWidth - tipWidth - 8));

      const top = placeAbove
        ? rect.top - tipHeight - TIP_GAP
        : rect.bottom + TIP_GAP;

      setCoords({ top, left, width: tipWidth });
    };

    place();
    const raf = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, text]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (
        !rootRef.current?.contains(event.target) &&
        !tipRef.current?.contains(event.target)
      ) {
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

  const tip =
    open && mounted
      ? createPortal(
          <span
            id={tipId}
            ref={tipRef}
            role="tooltip"
            className={classes.tipFixed}
            style={
              coords
                ? {
                    top: coords.top,
                    left: coords.left,
                    width: coords.width,
                  }
                : { visibility: "hidden", top: 0, left: 0 }
            }
          >
            {text}
          </span>,
          document.body
        )
      : null;

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
      {tip}
    </span>
  );
}
