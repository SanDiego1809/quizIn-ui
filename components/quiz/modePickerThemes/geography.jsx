"use client";

import classes from "./geography.module.css";

function CountriesIcon() {
  return (
    <svg
      className={`${classes.icon} ${classes.globeRing}`}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <circle
        cx="24"
        cy="24"
        r="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <ellipse
        className={classes.globeMeridian}
        cx="24"
        cy="24"
        rx="7"
        ry="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 24h32M10.5 16h27M10.5 32h27"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle className={classes.globeDot} cx="30" cy="18" r="1.6" fill="#38bdf8" />
    </svg>
  );
}

function FlagsIcon() {
  return (
    <svg className={classes.icon} viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M14 8v32"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <g className={classes.flagWave}>
        <path d="M16 10h18l-3 5 3 5H16z" fill="#ef4444" />
        <path d="M16 20h18l-3 5 3 5H16z" fill="#f8fafc" />
        <path d="M16 10v20" stroke="#3b82f6" strokeWidth="3" />
      </g>
    </svg>
  );
}

function CapitalsIcon() {
  return (
    <svg
      className={`${classes.icon} ${classes.pinPulse}`}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <ellipse
        className={classes.pinRipple}
        cx="24"
        cy="40"
        rx="7"
        ry="2.5"
        fill="currentColor"
        opacity="0.25"
      />
      <path
        d="M24 8c-6.1 0-11 4.7-11 10.5 0 7.4 11 21.5 11 21.5s11-14.1 11-21.5C35 12.7 30.1 8 24 8z"
        fill="#fbbf24"
        opacity="0.95"
      />
      <circle cx="24" cy="18.5" r="4" fill="#0f172a" />
    </svg>
  );
}

function TeamsIcon() {
  return (
    <svg className={classes.icon} viewBox="0 0 48 48" aria-hidden="true">
      <circle
        className={classes.teamLeft}
        cx="15"
        cy="20"
        r="7"
        fill="#38bdf8"
        opacity="0.9"
      />
      <circle
        className={classes.teamRight}
        cx="33"
        cy="20"
        r="7"
        fill="#f87171"
        opacity="0.9"
      />
      <text
        className={classes.vsPulse}
        x="24"
        y="38"
        textAnchor="middle"
        fill="currentColor"
        fontSize="10"
        fontWeight="800"
      >
        VS
      </text>
    </svg>
  );
}

export const geographyModePickerTheme = {
  countries: {
    className: classes.countries,
    Icon: CountriesIcon,
  },
  flags: {
    className: classes.flags,
    Icon: FlagsIcon,
  },
  capitals: {
    className: classes.capitals,
    Icon: CapitalsIcon,
  },
  teams: {
    className: classes.teams,
    Icon: TeamsIcon,
  },
};

export default geographyModePickerTheme;
