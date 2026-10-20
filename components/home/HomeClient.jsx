"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ModeFavoriteButton from "@/components/auth/ModeFavoriteButton";
import JsonLd from "@/components/seo/JsonLd";
import { useLang } from "@/components/site/LangProvider";
import {
  organizationJsonLd,
  softwareApplicationJsonLd,
  webSiteJsonLd,
} from "@/lib/site/jsonLd";
import { SITE_NAME } from "@/lib/site/site";
import { getTranslations } from "@/lib/i18n";
import EarthGlobe from "./EarthGlobe";

const ShowTimeIcon = dynamic(() => import("./ShowTimeIcon"), { ssr: false });
const UndercoverIcon = dynamic(() => import("./UndercoverIcon"), { ssr: false });
import HomeFaqTeaser from "./HomeFaqTeaser";
import HomeRecentGames from "./HomeRecentGames";
import classes from "./HomePage.module.css";

const MODES = [
  { id: "classic", infoHref: "/classic-quiz" },
  { id: "geography", infoHref: "/geography-quiz" },
  { id: "undercover", infoHref: "/play?mode=undercover" },
];

function ModeInfoIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="6.25" r="1.1" fill="currentColor" />
      <path
        d="M10 9.1v5.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function normalizeRoomCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

export default function HomeClient() {
  const router = useRouter();
  const { lang } = useLang();
  const all = getTranslations(lang);
  const t = all.home;
  const steps = t.steps || [];
  const jsonLd = [webSiteJsonLd(), organizationJsonLd(), softwareApplicationJsonLd()];
  const [roomCode, setRoomCode] = useState("");

  function handleJoin(event) {
    event.preventDefault();
    const code = normalizeRoomCode(roomCode);
    if (code.length < 4) return;
    router.push(`/play?code=${encodeURIComponent(code)}&lang=${lang}`);
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className={classes.shell}>
        <main className={classes.main}>
          <header className={classes.hero}>
            <h1 className={classes.heroBrand}>
              <img
                src="/quizin-logo-dark.png"
                alt={SITE_NAME}
                className={classes.heroLogo}
                width={949}
                height={429}
                decoding="async"
              />
            </h1>

            {steps.length > 0 ? (
              <section className={classes.steps} aria-labelledby="home-steps">
                <h2 id="home-steps" className={classes.sectionTitle}>
                  {t.stepsHeading}
                </h2>
                <ol className={classes.stepsList}>
                  {steps.map((step, index) => {
                    const inner = (
                      <>
                        <span className={classes.stepNum}>{index + 1}</span>
                        <span className={classes.stepCopy}>
                          <span className={classes.stepTitle}>{step.title}</span>
                          <span className={classes.stepBody}>{step.body}</span>
                        </span>
                      </>
                    );
                    return (
                      <li key={step.title} className={classes.stepItem}>
                        {index === 0 ? (
                          <Link href={`/play?lang=${lang}`} className={classes.stepLink}>
                            {inner}
                          </Link>
                        ) : (
                          <div className={classes.stepLink}>{inner}</div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>
            ) : null}

            <form className={classes.joinForm} onSubmit={handleJoin}>
              <label className={classes.joinLabel} htmlFor="home-room-code">
                {t.joinCodeLabel}
              </label>
              <div className={classes.joinRow}>
                <input
                  id="home-room-code"
                  name="roomCode"
                  className={classes.joinInput}
                  value={roomCode}
                  onChange={(e) => setRoomCode(normalizeRoomCode(e.target.value))}
                  placeholder={t.joinCodePlaceholder}
                  maxLength={6}
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="text"
                  aria-label={t.joinCodeLabel}
                />
                <button
                  type="submit"
                  className={classes.joinButton}
                  disabled={roomCode.length < 4}
                >
                  {t.joinCta}
                </button>
                <Link href={`/play?lang=${lang}`} className={classes.hostButton}>
                  {t.hostCta}
                </Link>
              </div>
            </form>
          </header>

          <section className={classes.section} aria-labelledby="home-modes">
            <h2 id="home-modes" className={classes.sectionTitle}>
              {t.modesHeading}
            </h2>
            <div className={classes.modeGrid}>
              {MODES.map(({ id, infoHref }, index) => {
                const mode = all.modes[id];
                const infoHrefWithLang = infoHref.includes("?")
                  ? `${infoHref}&lang=${lang}`
                  : `${infoHref}?lang=${lang}`;
                return (
                  <article
                    key={id}
                    className={`${classes.modeCard} ${classes[id]}${id === "geography" ? " geoCard" : ""}`}
                    style={{ "--stagger": `${index * 90}ms` }}
                  >
                    <div className={classes.modeCorner}>
                      <Link
                        href={infoHrefWithLang}
                        className={classes.infoLink}
                        aria-label={mode.learnMore.replace(/\s*→\s*$/, "")}
                        title={mode.learnMore.replace(/\s*→\s*$/, "")}
                      >
                        <ModeInfoIcon />
                      </Link>
                      <ModeFavoriteButton modeId={id} />
                    </div>
                    <Link
                      href={`/play?mode=${id}&lang=${lang}`}
                      className={classes.modePlay}
                    >
                      {id === "classic" ? (
                        <ShowTimeIcon />
                      ) : id === "geography" ? (
                        <EarthGlobe />
                      ) : (
                        <UndercoverIcon />
                      )}
                      <h3 className={classes.modeName}>{mode.name}</h3>
                      <p className={classes.vibe}>{mode.vibe}</p>
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>

          <HomeRecentGames />
          <HomeFaqTeaser />
        </main>
      </div>
    </>
  );
}
