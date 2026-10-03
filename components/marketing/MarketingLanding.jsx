import Link from "next/link";
import Button from "@/components/button/Button";
import JsonLd from "@/components/seo/JsonLd";
import Title from "@/components/title/Title";
import { getLandingPage } from "@/lib/site/landingPages";
import { organizationJsonLd, webPageJsonLd } from "@/lib/site/jsonLd";
import { notFound } from "next/navigation";
import classes from "./MarketingLanding.module.css";

import { getTranslations } from "@/lib/i18n";
import { getLandingPageLocalized } from "@/lib/site/landingPages";

export default function MarketingLanding({ slug, lang = "en" }) {
  const page = getLandingPageLocalized(slug, lang) || getLandingPage(slug);
  if (!page) notFound();

  const jsonLd = [
    webPageJsonLd({
      title: page.title,
      description: page.description,
      path: `/${slug}`,
    }),
    organizationJsonLd(),
  ];

  const t = getTranslations(lang).marketing;
  const title = page.title;
  const headline = page.headline;
  const description = page.description;
  const bullets = page.bullets;
  const howItWorks = page.howItWorks;
  const playHref = page.playHref.includes("?")
    ? `${page.playHref}&lang=${lang}`
    : `${page.playHref}?lang=${lang}`;

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className={classes.main}>
        <header className={classes.hero}>
          <Title subtitle={description}>{headline}</Title>
          {page.modeLabel ? <p className={classes.modeBadge}>{page.modeLabel}</p> : null}
          <Link href={playHref} className={classes.ctaWrap}>
            <Button>{t.cta}</Button>
          </Link>
        </header>

        <section className={classes.section} aria-labelledby={`${slug}-features`}>
          <h2 id={`${slug}-features`} className={classes.sectionTitle}>
            {t.whyPlay}
          </h2>
          <ul className={classes.bulletList}>
            {bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={classes.section} aria-labelledby={`${slug}-how`}>
          <h2 id={`${slug}-how`} className={classes.sectionTitle}>
            {t.howItWorks}
          </h2>
          <ol className={classes.steps}>
            {howItWorks.map((step, index) => (
              <li key={step.title} className={classes.step}>
                <span className={classes.stepNum}>{index + 1}</span>
                <div>
                  <h3 className={classes.stepTitle}>{step.title}</h3>
                  <p className={classes.stepBody}>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <nav className={classes.related} aria-label={t.relatedNav}>
          <span className={classes.relatedLabel}>{t.explore}</span>
          <Link href={`/multiplayer-quiz?lang=${lang}`}>{t.relatedMultiplayer}</Link>
          <Link href={`/classic-quiz?lang=${lang}`}>{t.relatedClassic}</Link>
          <Link href={`/geography-quiz?lang=${lang}`}>{t.relatedGeography}</Link>
          <Link href={`/contact?lang=${lang}`}>{t.relatedContact}</Link>
        </nav>

        <Link href={`/?lang=${lang}`} className={classes.backLink}>
          {t.backHome}
        </Link>
      </main>
    </>
  );
}
