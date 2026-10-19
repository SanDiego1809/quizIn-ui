/**
 * TvPlayButton — adapted from Uiverse “black-pug-58” (MIT).
 * https://uiverse.io/Sophiek9h/black-pug-58
 * Credits: Sophiek9h / Kalagbor Sophia (variation), Praashoo7 / Prashant (original).
 * Full license: ./TvPlayButton.LICENSE.txt
 */
"use client";

import classes from "./TvPlayButton.module.css";

export default function TvPlayButton({
  children = "Play",
  onClick,
  type = "button",
  disabled = false,
  className = "",
}) {
  return (
    <button
      type={type}
      className={`${classes.button} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={classes.main}>
        <span className={classes.tv}>
          <span className={classes.display}>
            <span className={classes.screenOut}>
              <span className={classes.screenOut1}>
                <span className={classes.screen}>
                  <span className={classes.label}>{children}</span>
                </span>
              </span>
            </span>
          </span>

          <span className={classes.lines} aria-hidden="true">
            <span className={classes.line1} />
            <span className={classes.line2} />
            <span className={classes.line3} />
          </span>

          <span className={classes.knobs} aria-hidden="true">
            <span className={classes.b1}>
              <span className={classes.b1Inner} />
            </span>
            <span className={classes.b2} />
            <span className={classes.speakers}>
              <span className={classes.speakerRow}>
                <span className={classes.dot} />
                <span className={classes.dot} />
                <span className={classes.dot} />
              </span>
              <span className={classes.grill} />
              <span className={classes.grill} />
            </span>
          </span>
        </span>

        <span className={classes.bottom} aria-hidden="true">
          <span className={classes.base1} />
          <span className={classes.base2} />
          <span className={classes.base3} />
        </span>
      </span>
    </button>
  );
}
