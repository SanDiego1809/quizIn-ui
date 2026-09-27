import { createPageMetadata } from "./metadata";
import { getLandingPage } from "./landingPages";

export function buildLandingMetadata(slug) {
  const page = getLandingPage(slug);
  if (!page) {
    return { title: "Not found" };
  }
  return createPageMetadata({
    title: page.title,
    description: page.description,
    path: `/${slug}`,
    keywords: page.keywords,
  });
}
