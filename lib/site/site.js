export const SITE_NAME = "QuizIn";

export const SITE_TAGLINE =
  "Free multiplayer quiz online — create a room, share a code, play with friends.";

export const DEFAULT_DESCRIPTION =
  "QuizIn is a free real-time multiplayer quiz. Host classic trivia or geography map quizzes with friends using a simple room code — no account required.";

/** Set in production: https://your-domain.com (no trailing slash) */
export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export const SITE_KEYWORDS = [
  "multiplayer quiz",
  "online quiz with friends",
  "free quiz game",
  "real-time trivia",
  "geography quiz",
  "quiz room code",
];

export function absoluteUrl(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}
