/**
 * SpaceButton — adapted from Uiverse “stale-goat-96” (MIT).
 * https://uiverse.io/Yaksh37/stale-goat-96
 * Credits: Yaksh37 (variation), zanina-yassine / Yassine Zanina (original).
 * Full license: ./SpaceButton.LICENSE.txt
 */
"use client";

import classes from "./SpaceButton.module.css";

/** Deterministic star field from the original Uiverse markup. */
const STARS = [
  { left: 119.273, top: 18.0747, delay: 3.37051, scale: 0.196521 },
  { left: 166.774, top: 47.4519, delay: 3.03913, scale: 0.33078 },
  { left: 238.677, top: 19.6434, delay: 3.85796, scale: 1.29037 },
  { left: 22.2022, top: 4.69534, delay: 4.9415, scale: 1.82231 },
  { left: 206.74, top: 40.7685, delay: 1.59195, scale: 1.01375 },
  { left: 241.531, top: 14.2516, delay: 1.67616, scale: 0.811597 },
  { left: 14.754, top: 25.2924, delay: 0.0348248, scale: 0.102529 },
  { left: 220.444, top: 43.9803, delay: 1.5106, scale: 0.16088 },
  { left: 95.948, top: 54.8942, delay: 3.18662, scale: 1.7822 },
  { left: 30.3484, top: 36.5984, delay: 4.30868, scale: 1.16326 },
  { left: 184.622, top: 20.0923, delay: 2.83829, scale: 1.27781 },
  { left: 142.1, top: 22.3542, delay: 2.73988, scale: 1.62715 },
  { left: 145.079, top: 6.97553, delay: 0.0408754, scale: 0.468075 },
  { left: 6.67886, top: 38.4849, delay: 3.84019, scale: 0.272217 },
  { left: 201.17, top: 39.9168, delay: 2.93587, scale: 0.521258 },
  { left: 224.215, top: 42.9903, delay: 0.895495, scale: 0.0458902 },
  { left: 42.2308, top: 9.78383, delay: 4.58407, scale: 0.0422065 },
  { left: 91.2734, top: 14.0408, delay: 2.05927, scale: 0.11997 },
  { left: 35.6985, top: 52.6403, delay: 3.07343, scale: 0.672992 },
  { left: 76.4191, top: 48.453, delay: 2.35679, scale: 1.46957 },
  { left: 184.503, top: 4.18267, delay: 1.43409, scale: 0.606616 },
  { left: 221.039, top: 54.2493, delay: 2.92356, scale: 0.638665 },
  { left: 185.612, top: 44.3, delay: 1.36401, scale: 1.65012 },
  { left: 154.027, top: 45.9848, delay: 3.723, scale: 1.4118 },
  { left: 220.591, top: 4.95194, delay: 0.363098, scale: 0.52369 },
  { left: 236.028, top: 11.1663, delay: 3.67493, scale: 0.956478 },
  { left: 110.241, top: 20.2684, delay: 2.94906, scale: 1.2193 },
  { left: 12.602, top: 19.8836, delay: 4.072, scale: 1.49026 },
  { left: 30.0911, top: 37.9746, delay: 1.02002, scale: 1.41008 },
  { left: 62.3096, top: 9.64604, delay: 3.9445, scale: 0.231214 },
  { left: 44.7189, top: 32.4307, delay: 4.78921, scale: 0.359408 },
  { left: 191.866, top: 27.151, delay: 1.34451, scale: 1.13484 },
  { left: 47.6744, top: 3.00604, delay: 1.04567, scale: 0.682023 },
  { left: 98.6225, top: 49.6115, delay: 2.41384, scale: 1.96254 },
  { left: 57.4785, top: 29.6588, delay: 3.3569, scale: 1.53118 },
  { left: 13.2213, top: 24.538, delay: 1.69582, scale: 1.6236 },
  { left: 131.656, top: 31.1837, delay: 1.29918, scale: 1.84486 },
  { left: 56.9067, top: 51.9904, delay: 4.74375, scale: 0.749788 },
  { left: 82.8361, top: 54.3876, delay: 1.28648, scale: 0.566118 },
  { left: 193.213, top: 43.9428, delay: 0.390178, scale: 1.411 },
];

const SHOOTING_STARS = [
  { className: classes.shootingStar1, delay: 1.2122 },
  { className: classes.shootingStar2, delay: 0.777895 },
  { className: classes.shootingStar3, delay: 4.90483 },
  { className: classes.shootingStar4, delay: 3.66012 },
];

export default function SpaceButton({
  children = "Let's Go to Space",
  onClick,
  type = "button",
  disabled = false,
  className = "",
  containerClassName = "",
}) {
  return (
    <div className={`${classes.container} ${containerClassName}`.trim()}>
      <button
        type={type}
        className={`${classes.button} ${className}`.trim()}
        onClick={onClick}
        disabled={disabled}
      >
        <span className={classes.label}>{children}</span>
        {STARS.map((star, index) => (
          <div
            key={`star-${index}`}
            className={classes.star}
            aria-hidden="true"
            style={{
              left: `${star.left}px`,
              top: `${star.top}px`,
              animationDelay: `${star.delay}s`,
              transform: `scale(${star.scale})`,
            }}
          />
        ))}
        {SHOOTING_STARS.map((star, index) => (
          <div
            key={`shooting-${index}`}
            className={`${classes.shootingStar} ${star.className}`}
            aria-hidden="true"
            style={{ animationDelay: `${star.delay}s` }}
          />
        ))}
      </button>
    </div>
  );
}
