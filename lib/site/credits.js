import { getTranslations } from "@/lib/i18n";

/** Edit this file to add your own tutorial / video shoutouts. */

export const LIBRARIES = [
  {
    id: "nextjs",
    name: "Next.js",
    url: "https://nextjs.org/",
  },
  {
    id: "react",
    name: "React",
    url: "https://react.dev/",
  },
  {
    id: "socketio",
    name: "Socket.IO",
    url: "https://socket.io/",
  },
  {
    id: "clerk",
    name: "Clerk",
    url: "https://clerk.com/",
  },
  {
    id: "prisma",
    name: "Prisma",
    url: "https://www.prisma.io/",
  },
  {
    id: "threejs",
    name: "Three.js",
    url: "https://threejs.org/",
  },
  {
    id: "d3geo",
    name: "d3-geo",
    url: "https://github.com/d3/d3-geo",
  },
];

export const ASSET_CREDITS = [
  {
    id: "mixamo",
    name: "Mixamo",
    url: "https://www.mixamo.com/",
  },
  {
    id: "geoCountries",
    name: "World countries GeoJSON",
    url: "https://github.com/datasets/geo-countries",
  },
  {
    id: "openTriviaQa",
    name: "OpenTriviaQA",
    url: "https://github.com/uberspot/OpenTriviaQA",
  },
  {
    id: "flagcdn",
    name: "FlagCDN",
    url: "https://flagcdn.com/",
  },
];

/**
 * YouTube or other video tutorials you followed while building QuizIn.
 * Only entries with a non-empty `url` are shown on the contact page.
 */
export const LEARNING_VIDEOS = [
  {
    id: "d3GeoMap",
    url: "https://github.com/muratkemaldar/using-react-hooks-with-d3/tree/12-geo",
  },
  {
    id: "mocapAnimation",
    url: "https://github.com/bobbyroe/mocap-animation/tree/main",
  },
];

export const CONTACT = {
  email: "triaxisit@gmail.com",
};

function localizeList(items, localeMap, fields) {
  return items.map((item) => {
    const entry = localeMap?.[item.id] ?? {};
    const localized = { ...item };
    for (const field of fields) {
      localized[field] = entry[field] ?? item[field] ?? "";
    }
    return localized;
  });
}

/** Merge credit ids/urls with translated notes, titles, etc. */
export function getLocalizedCredits(lang = "en") {
  const t = getTranslations(lang).credits ?? {};
  return {
    libraries: localizeList(LIBRARIES, t.libraries, ["note"]),
    assets: localizeList(ASSET_CREDITS, t.assets, ["name", "note"]),
    videos: localizeList(LEARNING_VIDEOS, t.videos, ["title", "creator", "note"]).filter(
      (entry) => entry.url?.trim()
    ),
  };
}
