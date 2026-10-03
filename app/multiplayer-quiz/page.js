import MarketingLanding from "@/components/marketing/MarketingLanding";
import { buildLandingMetadata } from "@/lib/site/landingMetadata";

export const metadata = buildLandingMetadata("multiplayer-quiz");

export default async function MultiplayerQuizPage({ searchParams }) {
  const params = await searchParams;
  const lang = params?.lang || "en";
  return <MarketingLanding slug="multiplayer-quiz" lang={lang} />;
}
