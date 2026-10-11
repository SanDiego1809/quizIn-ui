import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { rootMetadata } from "@/lib/site/metadata";
import CookieConsent from "@/components/consent/CookieConsent";
import Analytics from "@/components/analytics/Analytics";
import AuthProvider from "@/components/auth/AuthProvider";
import LangProvider from "@/components/site/LangProvider";
import SiteChrome from "@/components/site/SiteChrome";

export const metadata = rootMetadata();

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <AuthProvider>
            <LangProvider>
              <SiteChrome>{children}</SiteChrome>
            </LangProvider>
            <Analytics />
            <CookieConsent />
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
