"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/site/LangProvider";
import { getHomeFaq } from "@/lib/site/faq";
import { getTranslations } from "@/lib/i18n";
import classes from "./HomePage.module.css";

const ROTATE_MS = 6000;
const MAX_ITEMS = 4;

export default function HomeFaqTeaser() {
  const { lang } = useLang();
  const t = getTranslations(lang).home;
  const items = getHomeFaq(lang).slice(0, MAX_ITEMS);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return undefined;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const id = window.setInterval(() => {
      setIndex((value) => (value + 1) % items.length);
    }, ROTATE_MS);

    return () => window.clearInterval(id);
  }, [items.length, paused]);

  if (!items.length) return null;

  const item = items[index] || items[0];

  return (
    <section
      className={classes.faqTeaser}
      aria-labelledby="home-faq-teaser"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={classes.sectionHead}>
        <h2 id="home-faq-teaser" className={classes.sectionTitle}>
          {t.faqHeading}
        </h2>
        <Link href={`/faq?lang=${lang}`} className={classes.sectionLink}>
          {t.faqSeeAll}
        </Link>
      </div>
      <div className={classes.faqCard} key={item.question}>
        <p className={classes.faqQuestion}>{item.question}</p>
        <p className={classes.faqAnswer}>{item.answer}</p>
      </div>
    </section>
  );
}
