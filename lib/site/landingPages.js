export const LANDING_SLUGS = [
  "multiplayer-quiz",
  "classic-quiz",
  "geography-quiz",
];

/**
 * @type {Record<string, {
 *   slug: string;
 *   title: string;
 *   headline: string;
 *   description: string;
 *   keywords: string[];
 *   playHref: string;
 *   modeLabel?: string;
 *   bullets: string[];
 *   howItWorks: { title: string; body: string }[];
 * }>}
 */
export const LANDING_PAGES = {
  "multiplayer-quiz": {
    slug: "multiplayer-quiz",
    title: "Multiplayer Quiz Online with Friends",
    headline: "Real-time multiplayer quiz rooms",
    description:
      "Host a free online quiz for friends. Create a room, share your code, and play classic trivia or geography together in the browser.",
    keywords: [
      "multiplayer quiz online",
      "quiz with friends",
      "online trivia room",
      "real-time quiz game",
    ],
    playHref: "/play",
    bullets: [
      "6-letter room codes — easy to share in chat or on a call",
      "Live scores and leaderboards after each game",
      "Classic trivia and geography map modes",
      "Works on desktop and mobile browsers",
    ],
    howItWorks: [
      {
        title: "Create a room",
        body: "Enter your name and tap Create room. You become the host.",
      },
      {
        title: "Invite friends",
        body: "Share the room code. Friends join with the same code and their names.",
      },
      {
        title: "Pick a mode & start",
        body: "The host chooses Classic or Geography, adjusts settings, and starts the quiz.",
      },
    ],
  },
  "classic-quiz": {
    slug: "classic-quiz",
    title: "Classic Trivia Quiz — Multiplayer",
    headline: "Multiple-choice trivia with friends",
    description:
      "Play a fast-paced classic quiz online. Everyone gets the same questions, races the timer, and competes for the top spot on the leaderboard.",
    keywords: [
      "classic trivia quiz",
      "multiple choice quiz online",
      "multiplayer trivia",
      "quiz night online",
    ],
    playHref: "/play?mode=classic",
    modeLabel: "Classic Quiz",
    bullets: [
      "Shared questions for every player in the room",
      "Configurable timer and number of questions",
      "Speed-based scoring for correct answers",
      "Answer review at the end of the game",
    ],
    howItWorks: [
      {
        title: "Join or host",
        body: "Open the quiz room, create a game, or join with a friend's code.",
      },
      {
        title: "Select Classic Quiz",
        body: "The host sets Classic mode and options like question count and time limit.",
      },
      {
        title: "Answer before time runs out",
        body: "Pick the right option quickly — faster correct answers score higher.",
      },
    ],
  },
  "geography-quiz": {
    slug: "geography-quiz",
    title: "Geography Quiz — World Map Game",
    headline: "Click countries on the world map",
    description:
      "Free online geography quiz: a country name appears — be the first to find it on the interactive world map. Perfect for map lovers and classroom fun.",
    keywords: [
      "geography quiz online",
      "world map quiz",
      "country quiz game",
      "map trivia multiplayer",
    ],
    playHref: "/play?mode=geography",
    modeLabel: "Geography Quiz",
    bullets: [
      "Interactive world map powered by d3-geo",
      "Country-name prompts — click the matching territory",
      "Multiplayer rooms with live competition",
      "Zoom and pan to explore the map while you play",
    ],
    howItWorks: [
      {
        title: "Start a geography room",
        body: "Create a room and choose Geography Quiz in the lobby (or use the button below).",
      },
      {
        title: "Read the country",
        body: "Each round shows a country name. Find it on the map before others do.",
      },
      {
        title: "Win the round",
        body: "First correct click scores the point. Play through all countries and check the final standings.",
      },
    ],
  },
};

export function getLandingPage(slug) {
  return LANDING_PAGES[slug] ?? null;
}
