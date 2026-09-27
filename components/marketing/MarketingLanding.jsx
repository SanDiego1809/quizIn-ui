import Link from "next/link";
import Button from "@/components/button/Button";
import JsonLd from "@/components/seo/JsonLd";
import Title from "@/components/title/Title";
import { getLandingPage } from "@/lib/site/landingPages";
import { organizationJsonLd, webPageJsonLd } from "@/lib/site/jsonLd";
import { notFound } from "next/navigation";
import classes from "./MarketingLanding.module.css";

export default function MarketingLanding({ slug }) {
  const page = getLandingPage(slug);
  if (!page) notFound();

  const jsonLd = [
    webPageJsonLd({
      title: page.title,
      description: page.description,
      path: `/${slug}`,
    }),
    organizationJsonLd(),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className={classes.main}>
        <header className={classes.hero}>
          <Title subtitle={page.description}>{page.headline}</Title>
          {page.modeLabel ? (
            <p className={classes.modeBadge}>{page.modeLabel}</p>
          ) : null}
          <Link href={page.playHref} className={classes.ctaWrap}>
            <Button>Play now — free</Button>
          </Link>
        </header>

        <section className={classes.section} aria-labelledby={`${slug}-features`}>
          <h2 id={`${slug}-features`} className={classes.sectionTitle}>
            Why play on QuizIn
          </h2>
          <ul className={classes.bulletList}>
            {page.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={classes.section} aria-labelledby={`${slug}-how`}>
          <h2 id={`${slug}-how`} className={classes.sectionTitle}>
            How it works
          </h2>
          <ol className={classes.steps}>
            {page.howItWorks.map((step, index) => (
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

        <nav className={classes.related} aria-label="Other quiz modes">
          <span className={classes.relatedLabel}>Explore</span>
          <Link href="/multiplayer-quiz">Multiplayer quiz</Link>
          <Link href="/classic-quiz">Classic trivia</Link>
          <Link href="/geography-quiz">Geography map quiz</Link>
          <Link href="/contact">Contact &amp; credits</Link>
        </nav>

        <Link href="/" className={classes.backLink}>
          ← Back home
        </Link>
      </main>
    </>
  );
}
