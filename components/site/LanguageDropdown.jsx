"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SUPPORTED_LANGS } from "@/lib/lang";
import { useLang } from "./LangProvider";
import classes from "./LanguageDropdown.module.css";

const LANG_LABELS = {
  en: "English",
  fr: "Français",
  es: "Español",
};

export default function LanguageDropdown({ label }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={classes.root} ref={rootRef}>
      <button
        type="button"
        className={classes.trigger}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={classes.code}>{lang.toUpperCase()}</span>
        <svg
          className={classes.chevron}
          viewBox="0 0 12 12"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M2.5 4.25 6 7.75l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          className={classes.menu}
          role="listbox"
          aria-label={label}
        >
          {SUPPORTED_LANGS.map((code) => {
            const active = code === lang;
            return (
              <li key={code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`${classes.option}${active ? ` ${classes.optionActive}` : ""}`}
                  onClick={() => {
                    setLang(code);
                    setOpen(false);
                  }}
                >
                  <span>{LANG_LABELS[code] || code.toUpperCase()}</span>
                  <span className={classes.optionCode}>{code.toUpperCase()}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
