import MarketingLanding from "@/components/marketing/MarketingLanding";
import { buildLandingMetadata } from "@/lib/site/landingMetadata";

export const metadata = buildLandingMetadata("classic-quiz");

export default async function ClassicQuizPage({ searchParams }) {
  const params = await searchParams;
  const lang = params?.lang || "en";
  return <MarketingLanding slug="classic-quiz" lang={lang} />;
}
