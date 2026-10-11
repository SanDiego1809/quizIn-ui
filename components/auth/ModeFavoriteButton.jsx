"use client";

import { useCallback, useEffect, useState } from "react";
import { SignInButton } from "@clerk/nextjs";
import { useClerkSession } from "@/components/auth/ClerkSessionProvider";
import { useLang } from "@/components/site/LangProvider";
import { getTranslations } from "@/lib/i18n";
import classes from "./ModeFavoriteButton.module.css";

export default function ModeFavoriteButton({ modeId }) {
  const { enabled, isLoaded, isSignedIn } = useClerkSession();
  const { lang } = useLang();
  const t = getTranslations(lang).favorites;
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled || !isSignedIn) {
      setActive(false);
      return;
    }
    const res = await fetch("/api/me/favorites");
    if (!res.ok) return;
    const data = await res.json();
    setActive(
      (data.favorites || []).some(
        (item) => item.targetType === "mode" && item.targetId === modeId
      )
    );
  }, [enabled, isSignedIn, modeId]);

  useEffect(() => {
    if (!isLoaded) return;
    refresh();
  }, [isLoaded, refresh]);

  if (!enabled) return null;

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button type="button" className={classes.button}>
          {t.signInToFavorite}
        </button>
      </SignInButton>
    );
  }

  async function toggle() {
    setBusy(true);
    setMessage("");
    try {
      if (active) {
        const res = await fetch(
          `/api/me/favorites?targetType=mode&targetId=${encodeURIComponent(modeId)}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error(t.error);
        setActive(false);
      } else {
        const res = await fetch("/api/me/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetType: "mode", targetId: modeId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.code === "PREMIUM_REQUIRED") {
            setMessage(t.premiumRequired);
          } else {
            throw new Error(data.error || t.error);
          }
          return;
        }
        setActive(true);
      }
    } catch (err) {
      setMessage(err?.message || t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={classes.wrap}>
      <button
        type="button"
        className={active ? classes.active : classes.button}
        onClick={toggle}
        disabled={busy}
      >
        {active ? t.remove : t.add}
      </button>
      {message ? <p className={classes.message}>{message}</p> : null}
    </div>
  );
}
