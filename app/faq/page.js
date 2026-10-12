import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import Title from "@/components/title/Title";
import { getHomeFaq } from "@/lib/site/faq";
import { faqPageJsonLd, organizationJsonLd, webPageJsonLd } from "@/lib/site/jsonLd";
import { createPageMetadata } from "@/lib/site/metadata";
import { getTranslations } from "@/lib/i18n";
import classes from "./page.module.css";

export const metadata = createPageMetadata({
  title: "FAQ — QuizIn",
  description:
    "Answers about QuizIn multiplayer quiz rooms, modes, scoring, and getting started.",
  path: "/faq",
  keywords: ["QuizIn FAQ", "multiplayer quiz help", "quiz modes"],
});

export default async function FaqPage({ searchParams }) {
  const params = await searchParams;
  const lang = params?.lang || "en";
  const t = getTranslations(lang).home;
  const faqItems = getHomeFaq(lang);

  const jsonLd = [
    webPageJsonLd({
      title: t.faqPageTitle,
      description: t.faqPageDescription,
      path: "/faq",
    }),
    faqPageJsonLd(faqItems),
    organizationJsonLd(),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className={classes.page}>
        <div className={classes.intro}>
          <Title subtitle={t.faqPageDescription}>{t.faqHeading}</Title>
        </div>

        <dl className={classes.faqList}>
          {faqItems.map((item) => (
            <div key={item.question} className={classes.faqItem}>
              <dt className={classes.faqQuestion}>{item.question}</dt>
              <dd className={classes.faqAnswer}>{item.answer}</dd>
            </div>
          ))}
        </dl>

        <Link href={`/?lang=${lang}`} className={classes.backLink}>
          {t.faqBackHome}
        </Link>
      </main>
    </>
  );
}
