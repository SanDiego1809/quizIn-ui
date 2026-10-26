"use client";

import RoleLottie from "./RoleLottie";
import classes from "./RoleIcon.module.css";

const ROLE_LOTTIE = {
  undercover: "/animations/ispettore-privacy.lottie",
  detective: "/animations/detective-searching.lottie",
  fool: "/animations/laughing-clown.lottie",
  civilian: "/animations/neutral.lottie",
  mr_white: "/animations/empty-ghost.lottie",
};

function MysterySvg() {
  return (
    <svg viewBox="0 0 64 80" aria-hidden="true" focusable="false">
      <ellipse cx="32" cy="20" rx="12" ry="14" fill="currentColor" opacity="0.35" />
      <path
        d="M14 74c0-12 8-20 18-20s18 8 18 20"
        fill="currentColor"
        opacity="0.28"
      />
      <text
        className={classes.q}
        x="32"
        y="52"
        textAnchor="middle"
        fontSize="42"
        fontWeight="900"
        fill="#f8fafc"
      >
        ?
      </text>
    </svg>
  );
}

export default function RoleIcon({
  role = "mystery",
  size = "md",
  className = "",
  title,
}) {
  const sizeClass =
    size === "sm" ? classes.sm : size === "lg" ? classes.lg : classes.md;
  const lottieSrc = ROLE_LOTTIE[role];

  if (lottieSrc) {
    return (
      <span
        className={`${classes.icon} ${classes.lottie} ${classes[role] || ""} ${sizeClass} ${className}`.trim()}
        role={title ? "img" : "presentation"}
        aria-label={title || undefined}
        aria-hidden={title ? undefined : true}
      >
        <RoleLottie src={lottieSrc} size={size} />
      </span>
    );
  }

  return (
    <span
      className={`${classes.icon} ${sizeClass} ${classes.mystery} ${className}`.trim()}
      role={title ? "img" : "presentation"}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      <MysterySvg />
    </span>
  );
}
