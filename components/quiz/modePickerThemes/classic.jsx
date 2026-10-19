"use client";

import classes from "./classic.module.css";

function SoloIcon() {
  return (
    <svg
      className={`${classes.icon} ${classes.buzzPulse}`}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <rect
        x="10"
        y="14"
        width="28"
        height="20"
        rx="4"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="2"
      />
      <circle cx="24" cy="24" r="5" fill="#38bdf8" />
      <path
        d="M18 38h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TeamsIcon() {
  return (
    <svg
      className={`${classes.icon} ${classes.vsFlash}`}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <circle cx="16" cy="22" r="7" fill="#38bdf8" opacity="0.9" />
      <circle cx="32" cy="22" r="7" fill="#f87171" opacity="0.9" />
      <text
        x="24"
        y="40"
        textAnchor="middle"
        fill="#fbbf24"
        fontSize="9"
        fontWeight="700"
      >
        VS
      </text>
    </svg>
  );
}

export const classicModePickerTheme = {
  solo: {
    className: classes.solo,
    Icon: SoloIcon,
  },
  teams: {
    className: classes.teams,
    Icon: TeamsIcon,
  },
};

export default classicModePickerTheme;
