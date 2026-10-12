import { LANDING_SLUGS } from "@/lib/site/landingPages";
import { absoluteUrl } from "@/lib/site/site";

/** @returns {import('next').MetadataRoute.Sitemap} */
export default function sitemap() {
  const staticPaths = [
    "",
    "/play",
    "/faq",
    "/contact",
    ...LANDING_SLUGS.map((s) => `/${s}`),
  ];

  return staticPaths.map((path) => ({
    url: absoluteUrl(path || "/"),
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/play") ? 0.9 : 0.75,
  }));
}
