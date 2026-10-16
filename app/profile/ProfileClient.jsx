"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Show, SignInButton } from "@clerk/nextjs";
import { useLang } from "@/components/site/LangProvider";
import { getTranslations } from "@/lib/i18n";
import { DEFAULT_VICTORY_ANIMATION } from "@/lib/quiz/animations";
import {
  DEFAULT_SKIN,
  listPurchasableShopItems,
  sanitizeSkinChoice,
  sanitizeVictoryAnimationChoice,
} from "@/lib/quiz/cosmetics";
import classes from "./profile.module.css";

const AvatarPicker = dynamic(() => import("@/components/avatar/AvatarPicker"), {
  ssr: false,
  loading: () => <p className={classes.hint}>Loading avatar…</p>,
});

function ProfilePanel() {
  const { lang } = useLang();
  const t = getTranslations(lang).profile;
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [favoriteLimit, setFavoriteLimit] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarKey, setAvatarKey] = useState(DEFAULT_VICTORY_ANIMATION);
  const [skinKey, setSkinKey] = useState(DEFAULT_SKIN);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [billingMessage, setBillingMessage] = useState("");
  const [shopMessage, setShopMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);
  const [unlockingId, setUnlockingId] = useState(null);

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
      setAvatarKey(
        sanitizeVictoryAnimationChoice(meData.profile.avatarKey, {
          plan: meData.profile.plan,
          unlockedCosmetics: meData.profile.unlockedCosmetics || [],
        })
      );
      setSkinKey(
        sanitizeSkinChoice(meData.profile.skinKey || DEFAULT_SKIN, {
          plan: meData.profile.plan,
          unlockedCosmetics: meData.profile.unlockedCosmetics || [],
        })
      );

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

  useEffect(() => {
    const billing = searchParams.get("billing");
    if (billing === "success") {
      setBillingMessage(t.billingSuccess);
      load();
    } else if (billing === "canceled") {
      setBillingMessage(t.billingCanceled);
    }
  }, [searchParams, t.billingSuccess, t.billingCanceled, load]);

  async function startBilling(path) {
    setBillingBusy(true);
    setBillingMessage("");
    try {
      const res = await fetch(path, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.billingError);
      if (!data.url) throw new Error(t.billingError);
      window.location.href = data.url;
    } catch (err) {
      setBillingMessage(err?.message || t.billingError);
      setBillingBusy(false);
    }
  }

  async function onSave(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, avatarKey, skinKey }),
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

  async function unlockCosmetic(catalogId) {
    setUnlockingId(catalogId);
    setShopMessage("");
    try {
      const res = await fetch("/api/me/cosmetics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.unlockError);
      setProfile(data.profile);
      setShopMessage(t.unlockSuccess);
    } catch (err) {
      setShopMessage(err?.message || t.unlockError);
    } finally {
      setUnlockingId(null);
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

  const access = {
    plan: profile?.plan,
    unlockedCosmetics: profile?.unlockedCosmetics || [],
  };
  const shopItems = listPurchasableShopItems(access);
  const isPremium = profile?.plan === "premium";

  return (
    <div className={classes.stack}>
      <section className={classes.panel}>
        <h1 className={classes.title}>{t.heading}</h1>
        <p className={classes.meta}>
          {t.credits}: <strong>{profile?.credits ?? 0}</strong>
          {" · "}
          {t.plan}: <strong>{isPremium ? t.premium : t.free}</strong>
        </p>
        <p className={classes.hint}>{t.premiumPerks}</p>

        <div className={classes.billingRow}>
          {!isPremium ? (
            <button
              type="button"
              className={classes.primary}
              disabled={billingBusy}
              onClick={() => startBilling("/api/stripe/checkout")}
            >
              {billingBusy ? t.billingRedirecting : t.upgradePremium}
            </button>
          ) : null}
          {profile?.hasBilling ? (
            <button
              type="button"
              className={classes.secondary}
              disabled={billingBusy}
              onClick={() => startBilling("/api/stripe/portal")}
            >
              {billingBusy ? t.billingRedirecting : t.manageBilling}
            </button>
          ) : null}
        </div>
        {billingMessage ? (
          <p
            className={
              searchParams.get("billing") === "success"
                ? classes.success
                : classes.message
            }
            role="status"
          >
            {billingMessage}
          </p>
        ) : null}

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
          <p className={classes.hint}>{t.avatarHint}</p>
          <AvatarPicker
            value={avatarKey}
            onChange={setAvatarKey}
            skinKey={skinKey}
            onSkinChange={setSkinKey}
            plan={access.plan}
            unlockedCosmetics={access.unlockedCosmetics}
            victoryLabel={t.avatar}
            skinLabel={t.skin}
          />
          <button type="submit" className={classes.primary} disabled={saving}>
            {saving ? t.saving : t.save}
          </button>
        </form>
        {message ? <p className={classes.message}>{message}</p> : null}
      </section>

      <section className={classes.panel}>
        <h2 className={classes.sectionTitle}>{t.shopHeading}</h2>
        <p className={classes.hint}>
          {isPremium ? t.shopPremiumNote : t.shopHint}
        </p>
        {shopItems.length === 0 ? (
          <p className={classes.hint}>{t.shopEmpty}</p>
        ) : (
          <ul className={classes.list}>
            {shopItems.map((item) => (
              <li key={item.catalogId} className={classes.listItem}>
                <span>
                  {item.kind === "skin" ? t.skin : t.avatar}: {item.label} ·{" "}
                  {item.creditCost} {t.credits.toLowerCase()}
                  {item.earnOnly ? ` · ${t.earnOnlyTag}` : ""}
                </span>
                <button
                  type="button"
                  className={classes.linkBtn}
                  disabled={unlockingId === item.catalogId}
                  onClick={() => unlockCosmetic(item.catalogId)}
                >
                  {unlockingId === item.catalogId ? t.unlocking : t.unlock}
                </button>
              </li>
            ))}
          </ul>
        )}
        {shopMessage ? <p className={classes.message}>{shopMessage}</p> : null}
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
