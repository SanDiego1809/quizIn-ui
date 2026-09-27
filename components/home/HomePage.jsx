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
import { SITE_TAGLINE } from "@/lib/site/site";
import classes from "./HomePage.module.css";

export default function HomePage() {
  const jsonLd = [
    webSiteJsonLd(),
    organizationJsonLd(),
    softwareApplicationJsonLd(),
    faqPageJsonLd(HOME_FAQ),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className={classes.main}>
        <header className={classes.hero}>
          <Title subtitle={SITE_TAGLINE}>
            Free multiplayer quiz with friends
          </Title>
          <Link href="/play" className={classes.ctaWrap}>
            <Button>Start a quiz</Button>
          </Link>
          <Link href="/contact" className={classes.footerLink}>
            Contact &amp; credits
          </Link>
        </header>

        <section className={classes.section} aria-labelledby="home-modes">
          <h2 id="home-modes" className={classes.sectionTitle}>
            Quiz modes
          </h2>
          <div className={classes.modeGrid}>
            <article className={classes.modeCard}>
              <h3 className={classes.modeName}>Classic Quiz</h3>
              <p className={classes.modeDesc}>
                Shared multiple-choice questions, timed rounds, and speed-based
                scoring. Great for trivia nights and quick party games.
              </p>
              <Link href="/classic-quiz" className={classes.modeLink}>
                Learn more →
              </Link>
            </article>
            <article className={classes.modeCard}>
              <h3 className={classes.modeName}>Geography Quiz</h3>
              <p className={classes.modeDesc}>
                A country name appears — click it on the interactive world map
                before your friends do. Built for map lovers and classrooms.
              </p>
              <Link href="/geography-quiz" className={classes.modeLink}>
                Learn more →
              </Link>
            </article>
          </div>
          <p className={classes.sectionLead}>
            <Link href="/multiplayer-quiz">Multiplayer quiz rooms</Link> use a
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
            Frequently asked questions
          </h2>
          <dl className={classes.faqList}>
            {HOME_FAQ.map((item) => (
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
