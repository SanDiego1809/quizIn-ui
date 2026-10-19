"use client";

import { CLASSIC_CATEGORIES, formatCategoryLabel } from "@/lib/quiz/classicCategories";
import classes from "./CategoryCardPicker.module.css";

export default function CategoryCardPicker({
  value = [],
  onChange,
  disabled = false,
  allLabel = "All categories",
  ariaLabel = "Category",
  optionLabels = {},
  multi = true,
}) {
  const selected = multi
    ? Array.isArray(value)
      ? value
      : value
        ? [value]
        : []
    : typeof value === "string"
      ? value
      : "";

  const options = [
    { value: "", label: allLabel },
    ...CLASSIC_CATEGORIES.map((id) => ({
      value: id,
      label: optionLabels[id] ?? formatCategoryLabel(id),
    })),
  ];

  const toggle = (nextValue) => {
    if (!multi) {
      onChange?.(nextValue);
      return;
    }
    if (nextValue === "") {
      onChange?.([]);
      return;
    }
    const set = new Set(selected);
    if (set.has(nextValue)) set.delete(nextValue);
    else set.add(nextValue);
    onChange?.([...set]);
  };

  return (
    <div
      className={`${classes.grid} ${disabled ? classes.disabled : ""}`}
      role="listbox"
      aria-label={ariaLabel}
      aria-multiselectable={multi || undefined}
      aria-disabled={disabled || undefined}
    >
      {options.map((option) => {
        const isSelected = multi
          ? option.value === ""
            ? selected.length === 0
            : selected.includes(option.value)
          : selected === option.value;
        return (
          <button
            key={option.value || "all"}
            type="button"
            role="option"
            aria-selected={isSelected}
            className={`${classes.card} ${isSelected ? classes.selected : ""}`}
            disabled={disabled}
            onClick={() => toggle(option.value)}
          >
            <span className={classes.cardLabel}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
