"use client";

import classes from "./Toggle.module.css";

export default function Toggle({
  icons = { isFalse: [], isTrue: [] },
  isToggled = false,
  onToggle,
  style,
  variant = "basic",
  disabled = false,
  label,
}) {
  function handleToggle() {
    if (disabled || !onToggle) return;
    onToggle(!isToggled);
  }

  const iconsToShow = isToggled ? icons.isTrue : icons.isFalse;

  return (
    <div
      className={`${classes.mainContainer} ${classes[variant]}${disabled ? ` ${classes.disabled}` : ""}`}
      style={style}
    >
      <button
        type="button"
        className={`${classes.iconContainer}${isToggled ? ` ${classes.toggled}` : ""}`}
        onClick={handleToggle}
        aria-label={label || "Toggle"}
        aria-pressed={isToggled}
        disabled={disabled}
      >
        {iconsToShow.map((Icon, index) => (
          <Icon key={index} />
        ))}
      </button>
    </div>
  );
}
