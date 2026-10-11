"use client";

import Link from "next/link";
import Button from "@/components/button/Button";
import ModeFavoriteButton from "@/components/auth/ModeFavoriteButton";
import JsonLd from "@/components/seo/JsonLd";
import Title from "@/components/title/Title";
import { useLang } from "@/components/site/LangProvider";
import { HOME_FAQ } from "@/lib/site/faq";
import {
  faqPageJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
  webSiteJsonLd,
} from "@/lib/site/jsonLd";
import { getTranslations } from "@/lib/i18n";
import classes from "./HomePage.module.css";

export default function HomeClient() {
  const { lang } = useLang();
  const all = getTranslations(lang);
  const t = all.home;
  const localizedFaq = all.home?.faq || [];
  const jsonLd = [
    webSiteJsonLd(),
    organizationJsonLd(),
    softwareApplicationJsonLd(),
    faqPageJsonLd(localizedFaq.length ? localizedFaq : HOME_FAQ),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className={classes.main}>
        <header className={classes.hero}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexDirection: "column" }}>
            <Title subtitle={t.subtitle}>{t.title}</Title>
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
              <ModeFavoriteButton modeId="classic" />
            </article>
            <article className={classes.modeCard}>
              <h3 className={classes.modeName}>{all.modes.geography.name}</h3>
              <p className={classes.modeDesc}>{all.modes.geography.description}</p>
              <Link href={`/geography-quiz?lang=${lang}`} className={classes.modeLink}>
                {all.modes.geography.learnMore}
              </Link>
              <ModeFavoriteButton modeId="geography" />
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
