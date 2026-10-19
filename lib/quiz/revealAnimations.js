import { DEFAULT_ANIMATION } from "@/lib/quiz/animations";

/** Map pedestal answerOutcome → Mixamo clip for classic show reveal. */
export function animationForAnswerOutcome(outcome) {
  switch (outcome) {
    case "correct":
      return "Joyful Jump";
    case "wrong":
      return "Reaction";
    case "missed":
      return "Neutral Idle";
    case "pending":
      return DEFAULT_ANIMATION;
    default:
      return DEFAULT_ANIMATION;
  }
}
