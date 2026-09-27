import "./globals.css";
import { rootMetadata } from "@/lib/site/metadata";
import CookieConsent from "@/components/consent/CookieConsent";
import Analytics from "@/components/analytics/Analytics";

export const metadata = rootMetadata();

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <CookieConsent />
        <footer style={{ textAlign: "center", padding: "1rem 0", color: "#94a3b8" }}>
          <a href="/privacy" style={{ color: "#94a3b8", textDecoration: "none", marginRight: 12 }}>
            Privacy
          </a>
          <a href="/contact" style={{ color: "#94a3b8", textDecoration: "none" }}>
            Contact
          </a>
        </footer>
      </body>
    </html>
  );
}
