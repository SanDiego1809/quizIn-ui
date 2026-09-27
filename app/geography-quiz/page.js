import MarketingLanding from "@/components/marketing/MarketingLanding";
import { buildLandingMetadata } from "@/lib/site/landingMetadata";

export const metadata = buildLandingMetadata("geography-quiz");

export default function GeographyQuizPage() {
  return <MarketingLanding slug="geography-quiz" />;
}
