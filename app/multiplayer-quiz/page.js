import MarketingLanding from "@/components/marketing/MarketingLanding";
import { buildLandingMetadata } from "@/lib/site/landingMetadata";

export const metadata = buildLandingMetadata("multiplayer-quiz");

export default function MultiplayerQuizPage() {
  return <MarketingLanding slug="multiplayer-quiz" />;
}
