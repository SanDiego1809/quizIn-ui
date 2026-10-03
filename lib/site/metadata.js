import { DEFAULT_DESCRIPTION, SITE_NAME, absoluteUrl } from "./site";

/**
 * @param {{
 *   title: string;
 *   description?: string;
 *   path: string;
 *   keywords?: string[];
 *   noIndex?: boolean;
 * }} options
 */
export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  keywords,
  noIndex = false,
  locales = ["en", "fr", "es"],
}) {
  const url = absoluteUrl(path);
  const fullTitle = title;

  const alternates = { canonical: path };
  // build hreflang alternate language mapping via ?lang=
  try {
    alternates.languages = {};
    for (const l of locales) {
      const [pathname, search = ""] = path.split("?");
      const params = new URLSearchParams(search);
      params.set("lang", l);
      const query = params.toString();
      const altPath = query ? `${pathname}?${query}` : pathname;
      alternates.languages[l] = absoluteUrl(altPath);
    }
  } catch (err) {
    // fallback: no languages mapping
  }

  return {
    title: fullTitle,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates,
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    ...(noIndex
      ? { robots: { index: false, follow: false } }
      : { robots: { index: true, follow: true } }),
  };
}

export function rootMetadata() {
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;

  return {
    metadataBase: new URL(absoluteUrl("/")),
    title: {
      default: `${SITE_NAME} — Free Multiplayer Quiz Online with Friends`,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: [
      "multiplayer quiz",
      "online quiz",
      "quiz with friends",
      "geography quiz game",
      "trivia room",
    ],
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: `${SITE_NAME} — Free Multiplayer Quiz Online with Friends`,
      description: DEFAULT_DESCRIPTION,
      url: absoluteUrl("/"),
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — Free Multiplayer Quiz Online with Friends`,
      description: DEFAULT_DESCRIPTION,
    },
    robots: {
      index: true,
      follow: true,
    },
    ...(googleVerification
      ? {
          verification: {
            google: googleVerification,
          },
        }
      : {}),
  };
}
