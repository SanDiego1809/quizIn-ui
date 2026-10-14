"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  resolveAvailableModes,
  resolveRoomMode,
} from "@/lib/quiz/modes/registry";
import classes from "./QuizRoomSettings.module.css";
import { getTranslations } from "@/lib/i18n";
import { formatCategoryLabel } from "@/lib/quiz/classicCategories";

function getModeMeta(room, modeId) {
  return resolveAvailableModes(room).find((m) => m.id === modeId) ?? null;
}

function formatSettingSummary(field, value) {
  if (value === undefined || value === null || value === "") return null;
  if (field.key === "questionsPerGame") {
    return `${value} question${value === 1 ? "" : "s"}`;
  }
  if (field.key === "questionTimeSeconds") {
    return value === 0 ? "no timer" : `${value}s each`;
  }
  if (field.key === "category") {
    return formatCategoryLabel(value);
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

  const parts = mode.settingsFields
    .map((field) => formatSettingSummary(field, room.settings?.[field.key]))
    .filter(Boolean);

  return parts.length ? `${modeName} (${parts.join(", ")})` : modeName;
}

export default function QuizRoomSettings({ room, isHost, onUpdateConfig, lang = "en" }) {
  const all = getTranslations(lang);
  const t = all.settings ?? {};
  const roomMode = resolveRoomMode(room);
  const availableModes = resolveAvailableModes(room);
  const hostPremium = room.hostPlan === "premium";

  const activeMode = useMemo(
    () => getModeMeta(room, roomMode),
    [room, roomMode]
  );

  const [draftMode, setDraftMode] = useState(roomMode);
  const [draftSettings, setDraftSettings] = useState(
    room.settings ?? activeMode?.defaultSettings ?? {}
  );

  useEffect(() => {
    setDraftMode(resolveRoomMode(room));
    setDraftSettings(room.settings ?? activeMode?.defaultSettings ?? {});
  }, [room, room.mode, room.settings, activeMode?.defaultSettings]);

  const draftModeMeta = useMemo(
    () => availableModes.find((m) => m.id === draftMode) ?? null,
    [availableModes, draftMode]
  );

  if (!activeMode) {
    return null;
  }

  const canUpdate = typeof onUpdateConfig === "function";

  if (!isHost) {
    return (
      <div className={classes.readOnly}>
        <p className={classes.readOnlyLabel}>{t.gameSetup ?? "Game setup"}</p>
        <p className={classes.readOnlyValue}>{formatRoomSettingsSummary(room, lang)}</p>
        {activeMode.description ? <p className={classes.hint}>{activeMode.description}</p> : null}
      </div>
    );
  }

  const onModeChange = (nextMode) => {
    setDraftMode(nextMode);
    const meta = availableModes.find((m) => m.id === nextMode);
    if (!meta) return;
    const nextSettings = { ...meta.defaultSettings };
    setDraftSettings(nextSettings);
    if (canUpdate) {
      onUpdateConfig({ mode: nextMode, settings: nextSettings });
    }
  };

  const onSettingChange = (key, rawValue) => {
    const field = draftModeMeta?.settingsFields.find((f) => f.key === key);
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

  return (
    <div className={classes.form}>
      <p className={classes.formLabel}>{t.gameSetup ?? "Game setup"}</p>

      <label className={classes.field}>
        <span className={classes.fieldLabel}>{t.modeLabel ?? "Mode"}</span>
        <select className={classes.select} value={draftMode} onChange={(e) => onModeChange(e.target.value)}>
          {availableModes.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {all.modes?.[mode.id]?.name ?? mode.label}
            </option>
          ))}
        </select>
      </label>

      {draftModeMeta ? (
        <p className={classes.hint}>
          {all.modes?.[draftMode]?.description ?? draftModeMeta.description}
        </p>
      ) : null}

      {!hostPremium ? (
        <p className={classes.premiumHint}>
          {t.premiumHostHint ??
            "Premium host unlocks category filters and longer games."}{" "}
          <Link href={`/profile?lang=${lang}`} className={classes.premiumLink}>
            {t.upgradeLink ?? "Upgrade"}
          </Link>
        </p>
      ) : null}

      {draftModeMeta?.settingsFields.map((field) => {
        const locked = Boolean(field.premium) && !hostPremium;
        const max = fieldMax(field, hostPremium);
        const label =
          all.settings_fields?.[field.key]?.label ?? field.label;
        const hint =
          all.settings_fields?.[field.key]?.hint ??
          (locked
            ? field.hint
            : field.premiumHint && !hostPremium
              ? field.premiumHint
              : field.hint);

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
                value={draftSettings[field.key] ?? ""}
                disabled={locked}
                onChange={(e) => onSettingChange(field.key, e.target.value)}
              >
                {(field.options || []).map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {hint ? <span className={classes.hint}>{hint}</span> : null}
            </label>
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
