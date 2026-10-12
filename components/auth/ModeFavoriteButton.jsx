"use client";

import { useCallback, useEffect, useState } from "react";
import { SignInButton } from "@clerk/nextjs";
import { useClerkSession } from "@/components/auth/ClerkSessionProvider";
import { useLang } from "@/components/site/LangProvider";
import Toggle from "@/components/toggle/Toggle";
import FavoriteBlankIcon from "@/components/toggle/icons/FavoriteBlankIcon";
import FavoriteCelebration from "@/components/toggle/icons/FavoriteCelebration";
import FavoriteFilledIcon from "@/components/toggle/icons/FavoriteFilledIcon";
import { useFlashBanner } from "@/components/ui/FlashBanner";
import { getTranslations } from "@/lib/i18n";
import classes from "./ModeFavoriteButton.module.css";

const FAVORITE_ICONS = {
  isTrue: [FavoriteFilledIcon, FavoriteCelebration],
  isFalse: [FavoriteBlankIcon],
};

const TOGGLE_STYLE = {
  "--primary-color": "#f472b6",
  "--size": "1.75rem",
};

export default function ModeFavoriteButton({ modeId }) {
  const { enabled, isLoaded, isSignedIn } = useClerkSession();
  const { lang } = useLang();
  const t = getTranslations(lang).favorites;
  const { showBanner } = useFlashBanner();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

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
        <button
          type="button"
          className={classes.signInToggle}
          style={TOGGLE_STYLE}
          aria-label={t.signInToFavorite}
        >
          <FavoriteBlankIcon />
        </button>
      </SignInButton>
    );
  }

  async function toggleFavorite() {
    if (busy) return;
    setBusy(true);
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
            showBanner(t.premiumRequired, { tone: "warning", durationMs: 4000 });
          } else {
            throw new Error(data.error || t.error);
          }
          return;
        }
        setActive(true);
      }
    } catch (err) {
      showBanner(err?.message || t.error, { tone: "error", durationMs: 4000 });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={classes.wrap}>
      <Toggle
        variant="favorite"
        icons={FAVORITE_ICONS}
        isToggled={active}
        onToggle={() => {
          void toggleFavorite();
        }}
        style={TOGGLE_STYLE}
        disabled={busy}
        label={active ? t.remove : t.add}
      />
    </div>
  );
}
