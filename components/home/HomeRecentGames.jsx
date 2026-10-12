"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useClerkSession } from "@/components/auth/ClerkSessionProvider";
import { useLang } from "@/components/site/LangProvider";
import { getTranslations } from "@/lib/i18n";
import classes from "./HomePage.module.css";

function formatPlayedAt(value, lang) {
  try {
    return new Intl.DateTimeFormat(lang, {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function HomeRecentGames() {
  const { enabled, isLoaded, isSignedIn } = useClerkSession();
  const { lang } = useLang();
  const t = getTranslations(lang).home;
  const modes = getTranslations(lang).modes;
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!enabled || !isLoaded || !isSignedIn) {
      setItems([]);
      return undefined;
    }

    let cancelled = false;
    fetch("/api/me/history")
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setItems((data?.history || []).slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, isLoaded, isSignedIn]);

  if (!enabled || !isSignedIn || items.length === 0) return null;

  return (
    <section className={classes.section} aria-labelledby="home-recent">
      <div className={classes.sectionHead}>
        <h2 id="home-recent" className={classes.sectionTitle}>
          {t.recentHeading}
        </h2>
        <Link href={`/profile?lang=${lang}`} className={classes.sectionLink}>
          {t.recentSeeProfile}
        </Link>
      </div>
      <ul className={classes.recentList}>
        {items.map((row) => {
          const modeLabel = modes?.[row.mode]?.name || row.mode;
          const playHref =
            row.mode === "geography"
              ? `/play?mode=geography&lang=${lang}`
              : `/play?mode=classic&lang=${lang}`;
          return (
            <li key={row.id}>
              <Link href={playHref} className={classes.recentItem}>
                <span className={classes.recentMain}>
                  <strong>{modeLabel}</strong>
                  <span className={classes.recentMeta}>
                    {row.roomCode} · {formatPlayedAt(row.playedAt, lang)}
                  </span>
                </span>
                <span className={classes.recentScore}>
                  #{row.rank} · {row.score} pts
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
