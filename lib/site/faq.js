export const HOME_FAQ = [
  {
    question: "Is QuizIn free to play?",
    answer:
      "Yes. QuizIn is free — create a room, invite friends with a 6-letter code, and start playing. No account or download is required.",
  },
  {
    question: "How many players can join a quiz room?",
    answer:
      "Friends join the same room with your room code and display name. The host starts the game when everyone is ready.",
  },
  {
    question: "What quiz modes are available?",
    answer:
      "Classic Quiz is multiple-choice trivia with a shared timer. Geography Quiz shows a country name — players click the country on an interactive world map. The host picks the mode in the waiting room.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. QuizIn runs in your browser. For local development the game server must be running; in production the site connects automatically.",
  },
  {
    question: "How does scoring work?",
    answer:
      "In classic mode, faster correct answers earn more points. Geography mode rewards whoever finds the country on the map first. After the last question you see a leaderboard and review.",
  },
];

import { getTranslations } from "../i18n";

export function getHomeFaq(lang = "en") {
  const all = getTranslations(lang);
  return all.home?.faq?.length ? all.home.faq : HOME_FAQ;
}
