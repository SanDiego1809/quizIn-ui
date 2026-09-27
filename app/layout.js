import "./globals.css";
import { rootMetadata } from "@/lib/site/metadata";

export const metadata = rootMetadata();

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
