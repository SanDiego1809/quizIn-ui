"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import classes from "./FlashBanner.module.css";

const DEFAULT_DURATION_MS = 4000;
const EXIT_MS = 220;

const FlashBannerContext = createContext({
  showBanner: () => {},
  dismissBanner: () => {},
});

export function useFlashBanner() {
  return useContext(FlashBannerContext);
}

function BannerView({ message, tone, leaving, onDismiss, dismissLabel }) {
  if (!message) return null;

  return (
    <div
      className={classes.banner}
      role="status"
      aria-live="polite"
      data-tone={tone}
      data-leaving={leaving ? "true" : "false"}
    >
      <p className={classes.message}>{message}</p>
      <button type="button" className={classes.dismiss} onClick={onDismiss}>
        {dismissLabel}
      </button>
    </div>
  );
}

export function FlashBannerProvider({ children }) {
  const [banner, setBanner] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const hideTimerRef = useRef(null);
  const exitTimerRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const dismissBanner = useCallback(() => {
    clearTimers();
    setLeaving(true);
    exitTimerRef.current = setTimeout(() => {
      setBanner(null);
      setLeaving(false);
      exitTimerRef.current = null;
    }, EXIT_MS);
  }, [clearTimers]);

  const showBanner = useCallback(
    (message, options = {}) => {
      const text = String(message || "").trim();
      if (!text) return;

      clearTimers();
      setLeaving(false);
      setBanner({
        message: text,
        tone: options.tone || "warning",
        dismissLabel: options.dismissLabel || "OK",
        durationMs:
          typeof options.durationMs === "number"
            ? options.durationMs
            : DEFAULT_DURATION_MS,
      });
    },
    [clearTimers]
  );

  useEffect(() => {
    if (!banner || leaving) return undefined;

    hideTimerRef.current = setTimeout(() => {
      dismissBanner();
    }, banner.durationMs);

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [banner, leaving, dismissBanner]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const value = useMemo(
    () => ({ showBanner, dismissBanner }),
    [showBanner, dismissBanner]
  );

  return (
    <FlashBannerContext.Provider value={value}>
      <BannerView
        message={banner?.message}
        tone={banner?.tone}
        leaving={leaving}
        onDismiss={dismissBanner}
        dismissLabel={banner?.dismissLabel || "OK"}
      />
      {children}
    </FlashBannerContext.Provider>
  );
}
