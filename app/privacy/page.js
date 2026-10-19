import Title from "@/components/title/Title";
import Link from "next/link";
import { CONTACT } from "@/lib/site/credits";

export const metadata = {
  title: "Privacy Policy — QuizIn",
  description:
    "Privacy policy for QuizIn: what data we collect, how we use it, and how to contact us.",
};

export default function PrivacyPage() {
  const contactEmail = CONTACT.email || "quizinmail@gmail.com";
  const effectiveDate = "2026-09-27";

  return (
    <main style={{ maxWidth: "64rem", margin: "2.5rem auto", padding: "0 1.5rem" }}>
      <Title subtitle="Privacy, cookies, and legal information">Privacy Policy</Title>

      <p style={{ color: "#94a3b8", marginTop: 12 }}>
        Effective date: {effectiveDate}. This Privacy Policy explains how QuizIn ("we", "us", or
        "the Service") collects, uses, discloses, and protects personal data when you use the
        QuizIn website and related services. By using the Service you agree to the collection and
        use of information in accordance with this policy.
      </p>

      <section style={{ marginTop: 18 }}>
        <h2>1. Data we collect</h2>
        <p>We collect the following categories of data to provide and improve the Service.</p>
        <ul>
          <li>
            <strong>Account / game data:</strong> display names you enter to create/join rooms,
            room codes, selected avatar/animation choices. This data is used to run the multiplayer
            experience and may be visible to other players in the same room.
          </li>
          <li>
            <strong>Connection & server logs:</strong> IP addresses, timestamps, User-Agent, and
            socket connection metadata. We store minimal logs for abuse prevention and debugging.
          </li>
          <li>
            <strong>Analytics (optional):</strong> aggregated usage data (pageviews, events) via
            Google Analytics if you accept the cookie consent banner. IP anonymization is enabled.
          </li>
          <li>
            <strong>Public assets:</strong> non-personal files (geojson, FBX models, textures)
            used to render the app; these are listed in the project's attributions.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>2. How we use your data</h2>
        <ul>
          <li>Run the real-time game server and route messages between players.</li>
          <li>Provide, maintain, and improve the Service.</li>
          <li>Detect and prevent abuse, fraud, and security incidents.</li>
          <li>Analyze usage patterns to prioritize features (only with analytics consent).</li>
          <li>Respond to support requests and legal obligations.</li>
        </ul>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>3. Legal basis for processing (EEA / UK)</h2>
        <p>
          Where applicable, we rely on the following lawful bases for processing personal data:
        </p>
        <ul>
          <li>
            <strong>Contractual necessity:</strong> processing required to provide the multiplayer
            game and related features (e.g. routing messages to a room).
          </li>
          <li>
            <strong>Legitimate interests:</strong> for abuse prevention, security, and product
            improvement. We balance these interests against user privacy.
          </li>
          <li>
            <strong>Consent:</strong> for analytics and non-essential cookies; users may accept or
            decline via the cookie banner.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>4. Cookies and tracking</h2>
        <p>
          We use a simple cookie-consent mechanism. No analytics or tracking scripts are loaded
          until you grant consent. The consent choice is stored in your browser's localStorage.
        </p>
        <p>
          If you accept analytics, we load Google Analytics (GA4) with IP anonymization enabled.
          You can revoke consent by clearing the localStorage key <code>quizin_analytics_consent</code>
          or using your browser settings.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>5. Third-party services & processors</h2>
        <p>
          We use third-party services to operate the Service. These may include (examples):
        </p>
        <ul>
          <li>
            <strong>Google Analytics (Google LLC):</strong> web analytics. Google acts as a
            processor; Google’s privacy and data processing terms apply. We enable IP anonymization.
          </li>
          <li>
            <strong>Socket.IO / hosting provider:</strong> real-time transport and infrastructure
            hosting. Providers may process connection logs as part of service delivery.
          </li>
          <li>
            <strong>Open-source libraries:</strong> React, Next.js, Three.js, d3-geo, and others —
            these are included in the project's dependencies and are licensed independently.
          </li>
        </ul>
        <p style={{ color: "#94a3b8" }}>
          See <Link href="/contact">Contact &amp; credits</Link> for attributions and links to
          external projects.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>6. Data retention</h2>
        <p>
          We retain connection logs and minimal server telemetry for a limited time to diagnose
          issues and prevent abuse. Display names and room state exist while a room is active and
          may be removed shortly after the room expires. Analytics data retention is subject to
          your consent and Google Analytics settings.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>7. International transfers</h2>
        <p>
          Some service providers (e.g. Google) process data outside your country. Where transfers
          occur from the EEA/UK, we rely on the provider's transfer mechanisms and safeguards
          (e.g. SCCs). Contact us for details.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>8. Security</h2>
        <p>
          We implement reasonable technical and organizational measures to protect personal data,
          including encrypted connections (HTTPS) and restricted server access. No system is
          entirely secure — if you suspect a breach, contact us immediately.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>9. Children</h2>
        <p>
          The Service is not intended for children under 13 (or higher local minimum age). We do
          not knowingly collect personal data from children. If you believe we have collected data
          from a child, contact us to request deletion.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>10. Your rights</h2>
        <p>
          Depending on your jurisdiction you may have rights to access, correct, delete, or port
          your personal data, and to object to processing. To exercise these rights contact us at{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. We will verify requests to protect
          security and privacy.
        </p>
        <p style={{ color: "#94a3b8" }}>
          EU/EEA residents may also lodge a complaint with a supervisory authority.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>11. Copyright & third-party content</h2>
        <p>
          The app uses third-party assets and libraries. See the <Link href="/contact">credits</Link>{" "}
          page for attributions and links. If you believe any content on the site infringes your
          copyright, contact us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a> with a
          takedown request and supporting details.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>12. Changes to this policy</h2>
        <p>
          We may update this policy. Material changes will be posted on this page with an updated
          effective date. Continued use of the Service after changes constitutes acceptance of the
          revised policy.
        </p>
      </section>

      <section style={{ marginTop: 18, marginBottom: 48 }}>
        <h2>13. Contact</h2>
        <p>
          For privacy questions, data requests, or copyright notices contact:
          <br />
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </p>
        <p style={{ color: "#94a3b8", marginTop: 12 }}>
          This draft is intended to be a practical, developer-friendly privacy policy template.
          It is not legal advice — consider having a lawyer review and adapt it to your specific
          jurisdiction and business requirements.
        </p>
      </section>
    </main>
  );
}

