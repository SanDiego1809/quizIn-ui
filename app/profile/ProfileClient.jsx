"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { useLang } from "@/components/site/LangProvider";
import { getTranslations } from "@/lib/i18n";
import { ANIMATIONS, DEFAULT_ANIMATION } from "@/lib/quiz/animations";
import classes from "./profile.module.css";

function ProfilePanel() {
  const { lang } = useLang();
  const t = getTranslations(lang).profile;
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [favoriteLimit, setFavoriteLimit] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarKey, setAvatarKey] = useState(DEFAULT_ANIMATION);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    setMessage("");
    try {
      const [meRes, historyRes, favoritesRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/me/history"),
        fetch("/api/me/favorites"),
      ]);

      if (!meRes.ok) {
        const err = await meRes.json().catch(() => ({}));
        throw new Error(err.error || t.loadError);
      }

      const meData = await meRes.json();
      setProfile(meData.profile);
      setDisplayName(meData.profile.displayName || "");
      setAvatarKey(meData.profile.avatarKey || DEFAULT_ANIMATION);

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.history || []);
      }

      if (favoritesRes.ok) {
        const favoritesData = await favoritesRes.json();
        setFavorites(favoritesData.favorites || []);
        setFavoriteLimit(favoritesData.limit);
      }

      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setMessage(err?.message || t.loadError);
    }
  }, [t.loadError]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSave(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, avatarKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.saveError);
      setProfile(data.profile);
      setMessage(t.saved);
    } catch (err) {
      setMessage(err?.message || t.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function removeFavorite(targetType, targetId) {
    const res = await fetch(
      `/api/me/favorites?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setFavorites((prev) =>
        prev.filter(
          (item) =>
            !(item.targetType === targetType && item.targetId === targetId)
        )
      );
    }
  }

  if (status === "loading") {
    return <p className={classes.hint}>{t.loading}</p>;
  }

  if (status === "error") {
    return (
      <div className={classes.panel}>
        <p className={classes.error} role="alert">
          {message}
        </p>
        <button type="button" className={classes.secondary} onClick={load}>
          {t.retry}
        </button>
      </div>
    );
  }

  return (
    <div className={classes.stack}>
      <section className={classes.panel}>
        <h1 className={classes.title}>{t.heading}</h1>
        <p className={classes.meta}>
          {t.credits}: <strong>{profile?.credits ?? 0}</strong>
          {" · "}
          {t.plan}: <strong>{profile?.plan === "premium" ? t.premium : t.free}</strong>
        </p>

        <form className={classes.form} onSubmit={onSave}>
          <label className={classes.label}>
            {t.displayName}
            <input
              className={classes.input}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              required
            />
          </label>
          <label className={classes.label}>
            {t.avatar}
            <select
              className={classes.input}
              value={avatarKey}
              onChange={(e) => setAvatarKey(e.target.value)}
            >
              {ANIMATIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={classes.primary} disabled={saving}>
            {saving ? t.saving : t.save}
          </button>
        </form>
        {message ? <p className={classes.message}>{message}</p> : null}
      </section>

      <section className={classes.panel}>
        <h2 className={classes.sectionTitle}>{t.historyHeading}</h2>
        {history.length === 0 ? (
          <p className={classes.hint}>{t.historyEmpty}</p>
        ) : (
          <ul className={classes.list}>
            {history.map((row) => (
              <li key={row.id} className={classes.listItem}>
                <span>
                  {row.mode} · {row.roomCode}
                </span>
                <span>
                  #{row.rank} · {row.score} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={classes.panel}>
        <h2 className={classes.sectionTitle}>{t.favoritesHeading}</h2>
        <p className={classes.hint}>
          {favoriteLimit == null
            ? t.favoritesUnlimited
            : t.favoritesLimit.replace("{limit}", String(favoriteLimit))}
        </p>
        {favorites.length === 0 ? (
          <p className={classes.hint}>{t.favoritesEmpty}</p>
        ) : (
          <ul className={classes.list}>
            {favorites.map((row) => (
              <li key={row.id} className={classes.listItem}>
                <span>
                  {row.targetType}: {row.targetId}
                </span>
                <button
                  type="button"
                  className={classes.linkBtn}
                  onClick={() => removeFavorite(row.targetType, row.targetId)}
                >
                  {t.remove}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function ProfileClient() {
  const { lang } = useLang();
  const t = getTranslations(lang).profile;
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!clerkEnabled) {
    return (
      <main className={classes.main}>
        <p className={classes.hint}>{t.authNotConfigured}</p>
        <Link href={`/?lang=${lang}`} className={classes.back}>
          {t.backHome}
        </Link>
      </main>
    );
  }

  return (
    <main className={classes.main}>
      <Show when="signed-out">
        <section className={classes.panel}>
          <h1 className={classes.title}>{t.heading}</h1>
          <p className={classes.hint}>{t.signInRequired}</p>
          <SignInButton mode="modal">
            <button type="button" className={classes.primary}>
              {t.signIn}
            </button>
          </SignInButton>
        </section>
      </Show>
      <Show when="signed-in">
        <ProfilePanel />
      </Show>
      <Link href={`/?lang=${lang}`} className={classes.back}>
        {t.backHome}
      </Link>
    </main>
  );
}
