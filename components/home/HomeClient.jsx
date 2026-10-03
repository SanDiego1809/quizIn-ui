"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/button/Button";
import JsonLd from "@/components/seo/JsonLd";
import Title from "@/components/title/Title";
import { HOME_FAQ } from "@/lib/site/faq";
import {
  faqPageJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
  webSiteJsonLd,
} from "@/lib/site/jsonLd";
import { getTranslations } from "@/lib/i18n";
import classes from "./HomePage.module.css";

export default function HomeClient({ initialLang } = {}) {
  // Start with server-provided initialLang (or 'en') so server and client render match.
  const [lang, setLang] = useState(initialLang || "en");

  // After hydration, prefer stored local choice or navigator preference.
  useEffect(() => {
    try {
      const stored = localStorage.getItem("quizin_lang");
      if (stored && stored !== lang) {
        setLang(stored);
        return;
      }
      if (!stored) {
        // If no stored choice, try browser preference
        const nav = navigator?.language?.slice(0, 2);
        const candidate = nav || lang;
        if (candidate && candidate !== lang) {
          setLang(candidate);
        }
      }
    } catch {
      // ignore
    }
  }, []); // run once on mount

  useEffect(() => {
    try {
      localStorage.setItem("quizin_lang", lang);
    } catch {}
  }, [lang]);

  const all = getTranslations(lang);
  const t = all.home;
  const localizedFaq = all.home?.faq || [];
  const jsonLd = [webSiteJsonLd(), organizationJsonLd(), softwareApplicationJsonLd(), faqPageJsonLd(localizedFaq.length ? localizedFaq : HOME_FAQ)];

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className={classes.main}>
        <header className={classes.hero}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexDirection: "column" }}>
            <Title subtitle={t.subtitle}>{t.title}</Title>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setLang("en")} style={{ padding: "0.4rem 0.7rem", borderRadius: 8, cursor: "pointer" }}>
                EN
              </button>
              <button onClick={() => setLang("fr")} style={{ padding: "0.4rem 0.7rem", borderRadius: 8, cursor: "pointer" }}>
                FR
              </button>
              <button onClick={() => setLang("es")} style={{ padding: "0.4rem 0.7rem", borderRadius: 8, cursor: "pointer" }}>
                ES
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              <Link href={`/play?lang=${lang}`} className={classes.ctaWrap}>
                <Button>{t.play}</Button>
              </Link>
              <Link href={`/contact?lang=${lang}`} className={classes.footerLink} style={{ marginLeft: 12 }}>
                {t.contact}
              </Link>
            </div>
          </div>
        </header>

        <section className={classes.section} aria-labelledby="home-modes">
          <h2 id="home-modes" className={classes.sectionTitle}>
            {all.how?.title ?? "Quiz modes"}
          </h2>
          <div className={classes.modeGrid}>
            <article className={classes.modeCard}>
              <h3 className={classes.modeName}>{all.modes.classic.name}</h3>
              <p className={classes.modeDesc}>{all.modes.classic.description}</p>
              <Link href={`/classic-quiz?lang=${lang}`} className={classes.modeLink}>
                {all.modes.classic.learnMore}
              </Link>
            </article>
            <article className={classes.modeCard}>
              <h3 className={classes.modeName}>{all.modes.geography.name}</h3>
              <p className={classes.modeDesc}>{all.modes.geography.description}</p>
              <Link href={`/geography-quiz?lang=${lang}`} className={classes.modeLink}>
                {all.modes.geography.learnMore}
              </Link>
            </article>
          </div>
          <p className={classes.sectionLead}>
            <Link href={`/multiplayer-quiz?lang=${lang}`}>{t.multiplayerLink}</Link>{" "}
            {t.multiplayerNote}
          </p>
        </section>

        <section className={classes.section} aria-labelledby="home-how">
          <h2 id="home-how" className={classes.sectionTitle}>
            {all.how?.title ?? "How it works"}
          </h2>
          <ol className={classes.steps}>
            {(all.how?.steps || []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </section>

        <section className={classes.section} aria-labelledby="home-faq">
          <h2 id="home-faq" className={classes.sectionTitle}>
            {t.faqHeading}
          </h2>
          <dl className={classes.faqList}>
            {(all.home?.faq || HOME_FAQ).map((item) => (
              <div key={item.question} className={classes.faqItem}>
                <dt className={classes.faqQuestion}>{item.question}</dt>
                <dd className={classes.faqAnswer}>{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </>
  );
}

