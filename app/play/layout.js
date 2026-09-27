import { createPageMetadata } from "@/lib/site/metadata";

export const metadata = createPageMetadata({
  title: "Quiz Room — Play Online",
  description:
    "Create or join a free multiplayer quiz room. Share your code, pick classic trivia or geography mode, and play with friends in real time.",
  path: "/play",
  keywords: ["quiz room", "join quiz", "create quiz room", "multiplayer trivia"],
});

export default function PlayLayout({ children }) {
  return children;
}
