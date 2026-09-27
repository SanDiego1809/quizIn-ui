import MarketingLanding from "@/components/marketing/MarketingLanding";
import { buildLandingMetadata } from "@/lib/site/landingMetadata";

export const metadata = buildLandingMetadata("classic-quiz");

export default function ClassicQuizPage() {
  return <MarketingLanding slug="classic-quiz" />;
}
