"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  resolveAvailableModes,
  resolveRoomMode,
} from "@/lib/quiz/modes/registry";
import classes from "./QuizRoomSettings.module.css";
import { getTranslations } from "@/lib/i18n";
import { formatCategoryLabel } from "@/lib/quiz/classicCategories";
import { CONTINENT_OPTIONS } from "@/lib/quiz/continents";
import NumberStepper from "@/components/stepper/NumberStepper";
import ExpandableMultiSelect from "@/components/ui/ExpandableMultiSelect";

function settingsSyncKey(settings) {
  if (!settings || typeof settings !== "object") return "";
  try {
    return JSON.stringify(settings);
  } catch {
    return "";
  }
}

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
  if (field.key === "continents") {
    if (!Array.isArray(value) || value.length === 0) return null;
    const names = value.map((id) =>
      optionLabel(field.key, id, all, id)
    );
    return names.join(", ");
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
    .filter((field) => !(modeId === "geography" && field.key === "variant"))
    .map((field) => formatSettingSummary(field, settings[field.key], all))
    .filter(Boolean);

  return parts.length ? `${modeName} (${parts.join(", ")})` : modeName;
}

function renderNumberField({
  field,
  draftSettings,
  hostPremium,
  baseId,
  all,
  onSettingChange,
  fieldClassName = classes.field,
}) {
  const locked = Boolean(field.premium) && !hostPremium;
  const max = fieldMax(field, hostPremium);
  const fieldCopy = all.settings_fields?.[field.key];
  const label = fieldCopy?.label ?? field.label;
  const hint =
    fieldCopy?.hint ??
    (locked
      ? field.hint
      : field.premiumHint && !hostPremium
        ? field.premiumHint
        : field.hint);
  const fieldId = `${baseId}-${field.key}`;
  const labelId = `${fieldId}-label`;

  return (
    <div key={field.key} className={fieldClassName}>
      <span className={classes.fieldLabel} id={labelId}>
        {label}
        {field.premium ? <span className={classes.badge}>Premium</span> : null}
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

export default function QuizRoomSettings({ room, isHost, onUpdateConfig, lang = "en" }) {
  const all = getTranslations(lang);
  const t = all.settings ?? {};
  const roomMode = resolveRoomMode(room);
  const hostPremium = room.hostPlan === "premium";
  const baseId = useId();
  const isGeography = roomMode === "geography";

  const activeMode = useMemo(
    () => getModeMeta(room, roomMode),
    [room, roomMode]
  );

  const [draftSettings, setDraftSettings] = useState(() => {
    const next = room.settings ?? activeMode?.defaultSettings ?? {};
    return {
      ...next,
      continents: Array.isArray(next.continents) ? next.continents : [],
    };
  });
  const lastSyncedSettingsKey = useRef(settingsSyncKey(room.settings));
  const pendingContinentsRef = useRef(null);

  useEffect(() => {
    const next = room.settings ?? activeMode?.defaultSettings ?? {};
    const key = settingsSyncKey(next);
    // Ignore room payload churn (players joining, etc.) when settings are unchanged.
    if (key && key === lastSyncedSettingsKey.current) {
      return;
    }
    lastSyncedSettingsKey.current = key;

    setDraftSettings((prev) => {
      const serverContinents = Array.isArray(next.continents)
        ? next.continents
        : null;
      const pending = pendingContinentsRef.current;

      let continents;
      if (pending !== null) {
        const same =
          Array.isArray(serverContinents) &&
          serverContinents.length === pending.length &&
          serverContinents.every((id, i) => id === pending[i]);
        if (same) {
          pendingContinentsRef.current = null;
          continents = serverContinents;
        } else if (pending.length === 0) {
          // User cleared — keep empty until the server agrees.
          continents = [];
          if (Array.isArray(serverContinents) && serverContinents.length === 0) {
            pendingContinentsRef.current = null;
          }
        } else if (
          hostPremium &&
          (serverContinents == null || serverContinents.length === 0)
        ) {
          // Omit/empty echo for Premium: keep optimistic pick (race).
          continents = pending;
        } else {
          // Non-premium server wipe, or a different confirmed selection.
          pendingContinentsRef.current = null;
          continents = serverContinents ?? [];
        }
      } else if (serverContinents == null) {
        continents = Array.isArray(prev.continents) ? prev.continents : [];
      } else {
        continents = serverContinents;
      }

      return { ...next, continents };
    });
  }, [room.settings, room.mode, activeMode?.defaultSettings, hostPremium]);

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
        {isGeography ? (
          <p className={classes.geoTitle}>{modeName}</p>
        ) : null}
        <p className={classes.readOnlyValue}>{formatRoomSettingsSummary(room, lang)}</p>
        {!isGeography && modeDescription ? (
          <p className={classes.hint}>{modeDescription}</p>
        ) : null}
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
    if (field?.type === "multiselect" || key === "continents") {
      parsed = Array.isArray(rawValue) ? [...rawValue] : [];
      if (key === "continents") {
        pendingContinentsRef.current = parsed;
      }
    }

    const nextSettings = { ...draftSettings, [key]: parsed };
    setDraftSettings(nextSettings);
    lastSyncedSettingsKey.current = settingsSyncKey(nextSettings);
    if (canUpdate) {
      onUpdateConfig({ settings: nextSettings });
    }
  };

  const visibleFields = activeMode.settingsFields.filter((field) =>
    fieldIsVisible(field, draftSettings)
  );

  if (isGeography) {
    const numberFields = visibleFields.filter((field) => field.type === "number");
    const continentsCopy = all.settings_fields?.continents;
    const continentOptions = CONTINENT_OPTIONS.map((option) => ({
      value: option.value,
      label:
        continentsCopy?.options?.[option.value] ??
        option.label,
    }));

    return (
      <div className={`${classes.form} ${classes.geoForm}`}>
        <p className={classes.formLabel}>{t.gameSetup ?? "Game setup"}</p>
        <h3 className={classes.geoTitle}>{modeName}</h3>

        <div className={classes.geoContinents}>
          <span className={classes.fieldLabel}>
            {continentsCopy?.label ?? "Continents"}
            <span className={classes.badge}>Premium</span>
          </span>
          <ExpandableMultiSelect
            value={draftSettings.continents ?? []}
            options={continentOptions}
            onChange={(next) => onSettingChange("continents", next)}
            placeholder={continentsCopy?.all ?? "All continents"}
            expandDirection="up"
            disabled={!hostPremium}
            selectAllLabel={continentsCopy?.selectAll ?? "All"}
            clearLabel={continentsCopy?.clear ?? "Clear"}
            ariaLabel={continentsCopy?.label ?? "Continents"}
          />
          <span className={classes.hint}>
            {!hostPremium
              ? continentsCopy?.premiumHint ??
                "Premium host — filter the country pool by continent."
              : continentsCopy?.hint ??
                "Limit the country pool to selected continents. Empty = all."}
          </span>
        </div>

        <div className={classes.geoSteppers}>
          {numberFields.map((field) =>
            renderNumberField({
              field,
              draftSettings,
              hostPremium,
              baseId,
              all,
              onSettingChange,
            })
          )}
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
      </div>
    );
  }

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
          return renderNumberField({
            field,
            draftSettings,
            hostPremium,
            baseId,
            all,
            onSettingChange,
          });
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
