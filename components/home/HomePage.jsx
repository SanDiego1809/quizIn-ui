import Link from "next/link";
import Button from "@/components/button/Button";
import JsonLd from "@/components/seo/JsonLd";
import Title from "@/components/title/Title";
import { getHomeFaq } from "@/lib/site/faq";
import {
  faqPageJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
  webSiteJsonLd,
} from "@/lib/site/jsonLd";
import { SITE_TAGLINE } from "@/lib/site/site";
import { getTranslations } from "@/lib/i18n";
import classes from "./HomePage.module.css";

export default function HomePage({ lang = "en" }) {
  const all = getTranslations(lang);
  const t = all.home;
  const localizedFaq = getHomeFaq();
  const jsonLd = [webSiteJsonLd(), organizationJsonLd(), softwareApplicationJsonLd(), faqPageJsonLd(localizedFaq)];

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className={classes.main}>
        <header className={classes.hero}>
          <Title subtitle={t.subtitle}>
            {t.title}
          </Title>
          <Link href={`/play?lang=${lang}`} className={classes.ctaWrap}>
            <Button>{t.play}</Button>
          </Link>
          <Link href={`/contact?lang=${lang}`} className={classes.footerLink}>
            {t.contact}
          </Link>
        </header>

        <section className={classes.section} aria-labelledby="home-modes">
          <h2 id="home-modes" className={classes.sectionTitle}>
            {all.modes && all.how ? all.how.title : "Quiz modes"}
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
            <Link href={`/multiplayer-quiz?lang=${lang}`}>Multiplayer quiz rooms</Link> use a
            simple 6-letter code — no sign-up required.
          </p>
        </section>

        <section className={classes.section} aria-labelledby="home-how">
          <h2 id="home-how" className={classes.sectionTitle}>
            How it works
          </h2>
          <ol className={classes.steps}>
            <li>Create a room with your display name</li>
            <li>Share the room code with friends</li>
            <li>Host picks the mode and starts the game</li>
            <li>Compete on the live leaderboard</li>
          </ol>
        </section>

        <section className={classes.section} aria-labelledby="home-faq">
          <h2 id="home-faq" className={classes.sectionTitle}>
            {all.home?.faqHeading || "Frequently asked questions"}
          </h2>
          <dl className={classes.faqList}>
            {localizedFaq.map((item) => (
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
