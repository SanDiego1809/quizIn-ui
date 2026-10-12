"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import classes from "./CookieConsent.module.css";

const STORAGE_KEY = "quizin_analytics_consent";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function loadGtag(id) {
  if (!id) return;
  if (typeof window === "undefined") return;
  if (window.__quizin_gtag_loaded) return;

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  script.async = true;
  document.head.appendChild(script);

  const inline = document.createElement("script");
  inline.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${id}', { anonymize_ip: true });
  `;
  document.head.appendChild(inline);
  window.__quizin_gtag_loaded = true;
}

function readStoredConsent() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredConsent(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore quota / private mode failures
  }
}

export default function CookieConsent() {
  // undefined = not hydrated yet; null = no choice; granted | denied = chosen
  const [consent, setConsent] = useState(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConsent(readStoredConsent());
  }, []);

  useEffect(() => {
    if (consent === "granted") {
      loadGtag(GA_ID);
    }
  }, [consent]);

  function choose(value) {
    writeStoredConsent(value);
    setConsent(value);
  }

  if (!mounted || consent === undefined || consent) {
    return null;
  }

  return createPortal(
    <div className={classes.banner} role="dialog" aria-live="polite" aria-label="Cookie consent">
      <div className={classes.copy}>
        <div className={classes.title}>We use cookies for analytics</div>
        <div className={classes.body}>
          We use Google Analytics to measure site usage. Accept to enable analytics, or decline to
          opt out.
          <a href="/privacy" className={classes.privacy}>
            Privacy
          </a>
        </div>
      </div>
      <div className={classes.actions}>
        <button type="button" className={classes.decline} onClick={() => choose("denied")}>
          Decline
        </button>
        <button type="button" className={classes.accept} onClick={() => choose("granted")}>
          Accept
        </button>
      </div>
    </div>,
    document.body
  );
}
