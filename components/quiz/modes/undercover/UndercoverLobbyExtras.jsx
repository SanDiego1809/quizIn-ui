"use client";

import { useState } from "react";
import { UNDERCOVER_PRESETS } from "@/lib/quiz/undercoverPresets";
import classes from "./UndercoverModeView.module.css";

export default function UndercoverLobbyExtras({
  room,
  isHost,
  onUpdateConfig,
  t = {},
}) {
  const [common, setCommon] = useState("");
  const [undercover, setUndercover] = useState("");
  const pairs = Array.isArray(room?.settings?.customWordPairs)
    ? room.settings.customWordPairs
    : [];

  if (!isHost || !onUpdateConfig) return null;

  function applyPreset(preset) {
    onUpdateConfig({
      settings: {
        ...(room.settings || {}),
        ...preset.settings,
      },
    });
  }

  function addPair(event) {
    event.preventDefault();
    const c = common.trim();
    const u = undercover.trim();
    if (!c || !u || c.toLowerCase() === u.toLowerCase()) return;
    onUpdateConfig({
      settings: {
        ...(room.settings || {}),
        customWordPairs: [...pairs, { common: c, undercover: u }],
        wordSource:
          room.settings?.wordSource === "bank"
            ? "mixed"
            : room.settings?.wordSource || "mixed",
      },
    });
    setCommon("");
    setUndercover("");
  }

  function removePair(index) {
    onUpdateConfig({
      settings: {
        ...(room.settings || {}),
        customWordPairs: pairs.filter((_, i) => i !== index),
      },
    });
  }

  return (
    <div className={classes.lobbyExtras}>
      <p className={classes.lobbyExtrasLabel}>
        {t.presetsLabel || "Presets"}
      </p>
      <div className={classes.presetRow}>
        {UNDERCOVER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={classes.presetChip}
            onClick={() => applyPreset(preset)}
          >
            {t.presets?.[preset.labelKey] || preset.id}
          </button>
        ))}
      </div>

      <p className={classes.lobbyExtrasLabel}>
        {t.customPairsLabel || "Custom word pairs"}
      </p>
      <p className={classes.lobbyExtrasHint}>
        {t.customPairsHint || "common / undercover — stay in this room"}
      </p>
      <form className={classes.formRow} onSubmit={addPair}>
        <input
          className={classes.input}
          value={common}
          onChange={(e) => setCommon(e.target.value)}
          placeholder={t.commonPlaceholder || "Civilian word"}
          maxLength={80}
        />
        <input
          className={classes.input}
          value={undercover}
          onChange={(e) => setUndercover(e.target.value)}
          placeholder={t.undercoverPlaceholder || "Undercover word"}
          maxLength={80}
        />
        <button type="submit" className={classes.button}>
          {t.addPair || "Add pair"}
        </button>
      </form>
      {pairs.length ? (
        <ul className={classes.list}>
          {pairs.map((pair, index) => (
            <li key={`${pair.common}-${index}`} className={classes.listItem}>
              <span>
                {pair.common} / {pair.undercover}
              </span>
              <button
                type="button"
                className={`${classes.button} ${classes.buttonGhost}`}
                onClick={() => removePair(index)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
