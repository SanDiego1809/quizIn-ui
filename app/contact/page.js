import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import Title from "@/components/title/Title";
import {
  ASSET_CREDITS,
  CONTACT,
  LEARNING_VIDEOS,
  LIBRARIES,
} from "@/lib/site/credits";
import { organizationJsonLd, webPageJsonLd } from "@/lib/site/jsonLd";
import { createPageMetadata } from "@/lib/site/metadata";
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
          <a
            href={item.url}
            className={classes.creditName}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.name}
          </a>
          <p className={classes.creditNote}>{item.note}</p>
        </li>
      ))}
    </ul>
  );
}

export default function ContactPage() {
  const videos = LEARNING_VIDEOS.filter((entry) => entry.url?.trim());

  const jsonLd = [
    webPageJsonLd({
      title: "Contact & credits",
      description: PAGE_DESCRIPTION,
      path: "/contact",
    }),
    organizationJsonLd(),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className={classes.page}>
      <div className={classes.intro}>
        <Title subtitle="Questions, feedback, or ideas for QuizIn — we'd love to hear from you.">
          Contact
        </Title>
      </div>

      <section className={classes.section} aria-labelledby="contact-heading">
        <h2 id="contact-heading" className={classes.sectionTitle}>
          Get in touch
        </h2>
        <p className={classes.sectionLead}>
          QuizIn is a multiplayer quiz project. For bugs, feature ideas, or any
          other questions, reach us by email
          {CONTACT.email ? (
            <>
              {" "}
              at{" "}
              <a
                href={`mailto:${CONTACT.email}`}
                className={classes.emailInline}
              >
                {CONTACT.email}
              </a>
            </>
          ) : (
            "."
          )}
          {CONTACT.email ? "." : null}
        </p>
        <div className={classes.contactActions}>
          {CONTACT.github ? (
            <a
              href={CONTACT.github}
              className={classes.contactLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub repository
            </a>
          ) : null}
          {CONTACT.email ? (
            <a href={`mailto:${CONTACT.email}`} className={classes.contactLink}>
              {CONTACT.email}
            </a>
          ) : null}
          <Link href="/play" className={classes.contactLink}>
            Play a quiz
          </Link>
        </div>
      </section>

      <hr className={classes.divider} />

      <section className={classes.section} aria-labelledby="libraries-heading">
        <h2 id="libraries-heading" className={classes.sectionTitle}>
          Libraries &amp; tools
        </h2>
        <p className={classes.sectionLead}>
          Shoutout to the open-source projects that power this site.
        </p>
        <CreditList items={LIBRARIES} />
      </section>

      <section className={classes.section} aria-labelledby="assets-heading">
        <h2 id="assets-heading" className={classes.sectionTitle}>
          Assets &amp; data
        </h2>
        <CreditList items={ASSET_CREDITS} />
      </section>

      <hr className={classes.divider} />

      <section className={classes.section} aria-labelledby="videos-heading">
        <h2 id="videos-heading" className={classes.sectionTitle}>
          Tutorials &amp; videos
        </h2>
        <p className={classes.sectionLead}>
          Thanks to the creators whose walkthroughs helped shape QuizIn.
        </p>
        {videos.length > 0 ? (
          <ul className={classes.creditList}>
            {videos.map((video) => (
              <li key={video.url} className={classes.creditItem}>
                <div className={classes.videoItem}>
                  <a
                    href={video.url}
                    className={classes.videoTitle}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {video.title}
                  </a>
                  {video.creator ? (
                    <p className={classes.videoMeta}>{video.creator}</p>
                  ) : null}
                  {video.note ? (
                    <p className={classes.creditNote}>{video.note}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={classes.emptyVideos}>
            Add your tutorial links in{" "}
            <code>lib/site/credits.js</code> under{" "}
            <code>LEARNING_VIDEOS</code>.
          </p>
        )}
      </section>

      <Link href="/" className={classes.backLink}>
        ← Back home
      </Link>
    </main>
    </>
  );
}
