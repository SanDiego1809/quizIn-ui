"use client";

import RoleLottie from "./RoleLottie";

/** Same animation as the home Undercover card — square, no stretch, no extra panel. */
export default function UndercoverRoleLottie({ size = "md" }) {
  return <RoleLottie src="/animations/ispettore-privacy.lottie" size={size} />;
}
