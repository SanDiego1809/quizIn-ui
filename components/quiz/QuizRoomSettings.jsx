"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  resolveAvailableModes,
  resolveRoomMode,
} from "@/lib/quiz/modes/registry";
import classes from "./QuizRoomSettings.module.css";
import { getTranslations } from "@/lib/i18n";
import { formatCategoryLabel } from "@/lib/quiz/classicCategories";
import NumberStepper from "@/components/stepper/NumberStepper";

function getModeMeta(room, modeId) {
  return resolveAvailableModes(room).find((m) => m.id === modeId) ?? null;
}

function optionLabel(fieldKey, value, all, fallbackLabel) {
  const options = all.settings_fields?.[fieldKey]?.options;
  if (fieldKey === "category") {
    if (!options) return fallbackLabel ?? formatCategoryLabel(value);
    if (value === "" || value == null) {
      return options.all ?? fallbackLabel ?? "All categories";
    }
    return options[value] ?? fallbackLabel ?? formatCategoryLabel(value);
  }
  if (options && value != null && value !== "") {
    return options[value] ?? fallbackLabel;
  }
  return fallbackLabel ?? String(value ?? "");
}

function fieldIsVisible(field, settings) {
  if (!field.visibleWhen) return true;
  return Object.entries(field.visibleWhen).every(([key, allowed]) => {
    const current = settings?.[key];
    if (Array.isArray(allowed)) return allowed.includes(current);
    return current === allowed;
  });
}

function formatSettingSummary(field, value, all) {
  if (value === undefined || value === null || value === "") return null;
  if (field.key === "questionsPerGame") {
    return `${value} question${value === 1 ? "" : "s"}`;
  }
  if (field.key === "questionTimeSeconds") {
    return value === 0 ? "no timer" : `${value}s each`;
  }
  if (field.type === "select") {
    const match = (field.options || []).find((option) => option.value === value);
    return optionLabel(field.key, value, all, match?.label ?? String(value));
  }
  return String(value);
}

function fieldMax(field, hostPremium) {
  if (!hostPremium && typeof field.freeMax === "number") return field.freeMax;
  return field.max;
}

export function formatRoomSettingsSummary(room, lang = "en") {
  const modeId = resolveRoomMode(room);
  const mode = getModeMeta(room, modeId);
  if (!mode) return room.modeLabel ?? modeId;

  const all = getTranslations(lang);
  const modeName = all.modes?.[modeId]?.name ?? mode.label;
  const settings = room.settings ?? {};

  const parts = mode.settingsFields
    .filter((field) => fieldIsVisible(field, settings))
    .map((field) => formatSettingSummary(field, settings[field.key], all))
    .filter(Boolean);

  return parts.length ? `${modeName} (${parts.join(", ")})` : modeName;
}

export default function QuizRoomSettings({ room, isHost, onUpdateConfig, lang = "en" }) {
  const all = getTranslations(lang);
  const t = all.settings ?? {};
  const roomMode = resolveRoomMode(room);
  const hostPremium = room.hostPlan === "premium";
  const baseId = useId();

  const activeMode = useMemo(
    () => getModeMeta(room, roomMode),
    [room, roomMode]
  );

  const [draftSettings, setDraftSettings] = useState(
    room.settings ?? activeMode?.defaultSettings ?? {}
  );

  useEffect(() => {
    setDraftSettings(room.settings ?? activeMode?.defaultSettings ?? {});
  }, [room, room.mode, room.settings, activeMode?.defaultSettings]);

  if (!activeMode) {
    return null;
  }

  const canUpdate = typeof onUpdateConfig === "function";
  const modeName = all.modes?.[roomMode]?.name ?? activeMode.label;
  const modeDescription =
    all.modes?.[roomMode]?.description ?? activeMode.description;

  if (!isHost) {
    return (
      <div className={classes.readOnly}>
        <p className={classes.readOnlyLabel}>{t.gameSetup ?? "Game setup"}</p>
        <p className={classes.readOnlyValue}>{formatRoomSettingsSummary(room, lang)}</p>
        {modeDescription ? <p className={classes.hint}>{modeDescription}</p> : null}
      </div>
    );
  }

  const onSettingChange = (key, rawValue) => {
    const field = activeMode.settingsFields.find((f) => f.key === key);
    if (field?.premium && !hostPremium) return;

    let parsed = rawValue;
    if (field?.type === "number") {
      parsed = Number(rawValue);
      const max = fieldMax(field, hostPremium);
      if (Number.isFinite(max) && parsed > max) parsed = max;
      if (Number.isFinite(field.min) && parsed < field.min) parsed = field.min;
    }

    const nextSettings = { ...draftSettings, [key]: parsed };
    setDraftSettings(nextSettings);
    if (canUpdate) {
      onUpdateConfig({ settings: nextSettings });
    }
  };

  const visibleFields = activeMode.settingsFields.filter((field) =>
    fieldIsVisible(field, draftSettings)
  );

  return (
    <div className={classes.form}>
      <p className={classes.formLabel}>{t.gameSetup ?? "Game setup"}</p>

      <div className={classes.field}>
        <span className={classes.fieldLabel}>{t.modeLabel ?? "Mode"}</span>
        <p className={classes.modeLocked}>{modeName}</p>
        {modeDescription ? <p className={classes.hint}>{modeDescription}</p> : null}
        <p className={classes.hint}>
          {t.modeLockedHint ??
            "Mode was chosen on the home page. Create a new room to switch modes."}
        </p>
      </div>

      {!hostPremium ? (
        <p className={classes.premiumHint}>
          {t.premiumHostHint ??
            "Premium host unlocks category filters and longer games."}{" "}
          <Link href={`/profile?lang=${lang}`} className={classes.premiumLink}>
            {t.upgradeLink ?? "Upgrade"}
          </Link>
        </p>
      ) : null}

      {visibleFields.map((field) => {
        const locked = Boolean(field.premium) && !hostPremium;
        const max = fieldMax(field, hostPremium);
        const fieldCopy = all.settings_fields?.[field.key];
        const label =
          (field.labelKey === "settings_fields.variant.labelClassic"
            ? fieldCopy?.labelClassic
            : null) ??
          fieldCopy?.label ??
          field.label;
        const hint =
          (field.hintKey === "settings_fields.variant.hintClassic"
            ? fieldCopy?.hintClassic
            : null) ??
          fieldCopy?.hint ??
          (locked
            ? field.hint
            : field.premiumHint && !hostPremium
              ? field.premiumHint
              : field.hint);
        const fieldId = `${baseId}-${field.key}`;
        const labelId = `${fieldId}-label`;

        if (field.type === "select") {
          return (
            <label key={field.key} className={classes.field}>
              <span className={classes.fieldLabel}>
                {label}
                {field.premium ? (
                  <span className={classes.badge}>Premium</span>
                ) : null}
              </span>
              <select
                className={classes.select}
                value={
                  draftSettings[field.key] ??
                  activeMode.defaultSettings?.[field.key] ??
                  ""
                }
                disabled={locked}
                onChange={(e) => onSettingChange(field.key, e.target.value)}
              >
                {(field.options || []).map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {optionLabel(field.key, option.value, all, option.label)}
                  </option>
                ))}
              </select>
              {hint ? <span className={classes.hint}>{hint}</span> : null}
            </label>
          );
        }

        if (field.type === "number") {
          return (
            <div key={field.key} className={classes.field}>
              <span className={classes.fieldLabel} id={labelId}>
                {label}
                {field.premium ? (
                  <span className={classes.badge}>Premium</span>
                ) : null}
              </span>
              <NumberStepper
                id={fieldId}
                aria-labelledby={labelId}
                min={field.min}
                max={max}
                step={field.step}
                value={draftSettings[field.key] ?? ""}
                disabled={locked}
                onChange={(next) => onSettingChange(field.key, next)}
              />
              {hint ? <span className={classes.hint}>{hint}</span> : null}
            </div>
          );
        }

        return (
          <label key={field.key} className={classes.field}>
            <span className={classes.fieldLabel}>
              {label}
              {field.premium ? (
                <span className={classes.badge}>Premium</span>
              ) : null}
            </span>
            <input
              className={classes.input}
              type={field.type}
              min={field.min}
              max={max}
              step={field.step}
              value={draftSettings[field.key] ?? ""}
              disabled={locked}
              onChange={(e) => onSettingChange(field.key, e.target.value)}
            />
            {hint ? <span className={classes.hint}>{hint}</span> : null}
          </label>
        );
      })}
    </div>
  );
}
