"use client";

import { useEffect, useMemo, useState } from "react";
import {
  resolveAvailableModes,
  resolveRoomMode,
} from "@/lib/quiz/modes/registry";
import classes from "./QuizRoomSettings.module.css";
import { getTranslations } from "@/lib/i18n";

function getModeMeta(room, modeId) {
  return resolveAvailableModes(room).find((m) => m.id === modeId) ?? null;
}

function formatSettingSummary(field, value) {
  if (value === undefined || value === null) return null;
  if (field.key === "questionsPerGame") {
    return `${value} question${value === 1 ? "" : "s"}`;
  }
  if (field.key === "questionTimeSeconds") {
    return value === 0 ? "no timer" : `${value}s each`;
  }
  return String(value);
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
  const t = all.play;
  const roomMode = resolveRoomMode(room);
  const availableModes = resolveAvailableModes(room);

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
        <p className={classes.readOnlyLabel}>{all.settings?.gameSetup ?? "Game setup"}</p>
        <p className={classes.readOnlyValue}>{formatRoomSettingsSummary(room)}</p>
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
    const parsed = field?.type === "number" ? Number(rawValue) : rawValue;
    const nextSettings = { ...draftSettings, [key]: parsed };
    setDraftSettings(nextSettings);
    if (canUpdate) {
      onUpdateConfig({ settings: nextSettings });
    }
  };

  return (
    <div className={classes.form}>
      <p className={classes.formLabel}>{all.settings?.gameSetup ?? "Game setup"}</p>

      <label className={classes.field}>
        <span className={classes.fieldLabel}>{all.settings?.modeLabel ?? "Mode"}</span>
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

      {draftModeMeta?.settingsFields.map((field) => (
        <label key={field.key} className={classes.field}>
          <span className={classes.fieldLabel}>
            {all.settings_fields?.[field.key]?.label ?? field.label}
          </span>
          <input
            className={classes.input}
            type={field.type}
            min={field.min}
            max={field.max}
            step={field.step}
            value={draftSettings[field.key] ?? ""}
            onChange={(e) => onSettingChange(field.key, e.target.value)}
          />
          { (all.settings_fields?.[field.key]?.hint ?? field.hint) ? (
            <span className={classes.hint}>{all.settings_fields?.[field.key]?.hint ?? field.hint}</span>
          ) : null}
        </label>
      ))}
    </div>
  );
}
