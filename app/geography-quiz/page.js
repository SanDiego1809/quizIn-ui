import MarketingLanding from "@/components/marketing/MarketingLanding";
import { buildLandingMetadata } from "@/lib/site/landingMetadata";

export const metadata = buildLandingMetadata("geography-quiz");

export default async function GeographyQuizPage({ searchParams }) {
  const params = await searchParams;
  const lang = params?.lang || "en";
  return <MarketingLanding slug="geography-quiz" lang={lang} />;
}
