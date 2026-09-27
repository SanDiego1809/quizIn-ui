import HomePage from "@/components/home/HomePage";
import { createPageMetadata } from "@/lib/site/metadata";

export const metadata = createPageMetadata({
  title: "Free Multiplayer Quiz Online with Friends",
  path: "/",
});

export default function Page() {
  return <HomePage />;
}
