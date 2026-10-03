import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import Title from "@/components/title/Title";
import { CONTACT, getLocalizedCredits } from "@/lib/site/credits";
import { organizationJsonLd, webPageJsonLd } from "@/lib/site/jsonLd";
import { createPageMetadata } from "@/lib/site/metadata";
import { getTranslations } from "@/lib/i18n";
import classes from "./page.module.css";

const PAGE_DESCRIPTION =
  "Contact QuizIn for feedback and support. Credits for open-source libraries, assets, and tutorials used to build this multiplayer quiz.";

export const metadata = createPageMetadata({
  title: "Contact & credits",
  description: PAGE_DESCRIPTION,
  path: "/contact",
  keywords: ["QuizIn contact", "quiz app credits", "open source libraries"],
});

function CreditList({ items }) {
  return (
    <ul className={classes.creditList}>
      {items.map((item) => (
        <li key={item.name} className={classes.creditItem}>
          <a href={item.url} className={classes.creditName} target="_blank" rel="noopener noreferrer">
            {item.name}
          </a>
          <p className={classes.creditNote}>{item.note}</p>
        </li>
      ))}
    </ul>
  );
}

function EmailBody({ template, email }) {
  const [before = "", after = ""] = String(template ?? "").split("{email}");
  return (
    <p className={classes.sectionLead}>
      {before}
      <a href={`mailto:${email}`} className={classes.emailInline}>
        {email}
      </a>
      {after}
    </p>
  );
}

export default async function ContactPage({ searchParams }) {
  const params = await searchParams;
  const lang = params?.lang || "en";
  const t = getTranslations(lang).contact;
  const { libraries, assets, videos } = getLocalizedCredits(lang);

  const jsonLd = [
    webPageJsonLd({
      title: t.pageTitle,
      description: t.pageDescription,
      path: "/contact",
    }),
    organizationJsonLd(),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className={classes.page}>
        <div className={classes.intro}>
          <Title subtitle={t.lead}>{t.heading}</Title>
        </div>

        <section className={classes.section} aria-labelledby="contact-heading">
          <h2 id="contact-heading" className={classes.sectionTitle}>
            {t.getInTouch}
          </h2>
          <EmailBody template={t.getInTouchBody} email={CONTACT.email} />
          <div className={classes.contactActions}>
            {CONTACT.github ? (
              <a href={CONTACT.github} className={classes.contactLink} target="_blank" rel="noopener noreferrer">
                {t.github}
              </a>
            ) : null}
            <a href={`mailto:${CONTACT.email}`} className={classes.contactLink}>
              {CONTACT.email}
            </a>
            <Link href={`/play?lang=${lang}`} className={classes.contactLink}>
              {t.play}
            </Link>
          </div>
        </section>

        <hr className={classes.divider} />

        <section className={classes.section} aria-labelledby="libraries-heading">
          <h2 id="libraries-heading" className={classes.sectionTitle}>
            {t.librariesTitle}
          </h2>
          <p className={classes.sectionLead}>{t.librariesLead}</p>
          <CreditList items={libraries} />
        </section>

        <section className={classes.section} aria-labelledby="assets-heading">
          <h2 id="assets-heading" className={classes.sectionTitle}>
            {t.assetsTitle}
          </h2>
          <CreditList items={assets} />
        </section>

        <hr className={classes.divider} />

        <section className={classes.section} aria-labelledby="videos-heading">
          <h2 id="videos-heading" className={classes.sectionTitle}>
            {t.videosTitle}
          </h2>
          <p className={classes.sectionLead}>{t.videosLead}</p>
          {videos.length > 0 ? (
            <ul className={classes.creditList}>
              {videos.map((video) => (
                <li key={video.url} className={classes.creditItem}>
                  <div className={classes.videoItem}>
                    <a href={video.url} className={classes.videoTitle} target="_blank" rel="noopener noreferrer">
                      {video.title}
                    </a>
                    {video.creator ? <p className={classes.videoMeta}>{video.creator}</p> : null}
                    {video.note ? <p className={classes.creditNote}>{video.note}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={classes.emptyVideos}>{t.videosEmpty}</p>
          )}
        </section>

        <Link href={`/?lang=${lang}`} className={classes.backLink}>
          {t.backHome}
        </Link>
      </main>
    </>
  );
}
