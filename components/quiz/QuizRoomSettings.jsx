"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  resolveAvailableModes,
  resolveRoomMode,
} from "@/lib/quiz/modes/registry";
import classes from "./QuizRoomSettings.module.css";
import { getTranslations } from "@/lib/i18n";
import { CONTINENT_OPTIONS } from "@/lib/quiz/continents";
import NumberStepper from "@/components/stepper/NumberStepper";
import ExpandableMultiSelect from "@/components/ui/ExpandableMultiSelect";
import ExpandablePanel from "@/components/ui/ExpandablePanel";
import SettingInfoTip from "@/components/ui/SettingInfoTip";
import CategoryCardPicker from "@/components/quiz/CategoryCardPicker";
import { CLASSIC_CATEGORIES, formatCategoryLabel } from "@/lib/quiz/classicCategories";
import SettingsGroupIcon from "@/components/quiz/modes/undercover/settingsGroupIcons";

const UNDERCOVER_SETTING_GROUPS = [
  { id: "roles", fallbackLabel: "Roles" },
  { id: "round", fallbackLabel: "Round" },
  { id: "flow", fallbackLabel: "Voting" },
  { id: "clues", fallbackLabel: "Clues" },
];

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
      return (
        all.settings_fields?.category?.all ??
        options.all ??
        fallbackLabel ??
        "All categories"
      );
    }
    return options[value] ?? fallbackLabel ?? formatCategoryLabel(value);
  }
  if (options && value != null && value !== "") {
    return options[value] ?? fallbackLabel;
  }
  return fallbackLabel ?? String(value ?? "");
}

function normalizeCategorySetting(value) {
  if (Array.isArray(value)) {
    return value.map((id) => String(id || "").trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
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
  if (field.key === "continents" || field.key === "category") {
    const list = normalizeCategorySetting(value);
    if (!list.length) return null;
    const names = list.map((id) => optionLabel(field.key, id, all, id));
    return names.join(", ");
  }
  if (field.type === "checkbox") {
    if (!value) return null;
    return all.settings_fields?.[field.key]?.label ?? field.label;
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
    .filter(
      (field) =>
        !(
          (modeId === "geography" || modeId === "classic") &&
          field.key === "variant"
        )
    )
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
  hintAsTip = false,
}) {
  const locked = Boolean(field.premium) && !hostPremium;
  const max = fieldMax(field, hostPremium);
  const fieldCopy = all.settings_fields?.[field.key];
  const label = fieldCopy?.label ?? field.label;
  const hint =
    fieldCopy?.info ??
    fieldCopy?.hint ??
    (locked
      ? field.hint
      : !hostPremium && (fieldCopy?.premiumHint || field.premiumHint)
        ? fieldCopy?.premiumHint ?? field.premiumHint
        : field.hint);
  const fieldId = `${baseId}-${field.key}`;
  const labelId = `${fieldId}-label`;

  return (
    <div key={field.key} className={fieldClassName}>
      <span className={classes.fieldLabel} id={labelId}>
        {label}
        {field.premium ? <span className={classes.badge}>Premium</span> : null}
        {hintAsTip && hint ? <SettingInfoTip text={hint} /> : null}
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
      {!hintAsTip && hint ? <span className={classes.hint}>{hint}</span> : null}
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
  const isClassic = roomMode === "classic" || roomMode === "picture";
  const isUndercover = roomMode === "undercover";

  const activeMode = useMemo(
    () => getModeMeta(room, roomMode),
    [room, roomMode]
  );

  const [draftSettings, setDraftSettings] = useState(() => {
    const next = room.settings ?? activeMode?.defaultSettings ?? {};
    return {
      ...next,
      continents: Array.isArray(next.continents) ? next.continents : [],
      category: normalizeCategorySetting(next.category),
    };
  });
  const lastSyncedSettingsKey = useRef(settingsSyncKey(room.settings));
  const pendingContinentsRef = useRef(null);
  const [openSettingsGroup, setOpenSettingsGroup] = useState(null);

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

      return {
        ...next,
        continents,
        category: normalizeCategorySetting(next.category),
      };
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
        {isGeography || isClassic || isUndercover ? (
          <p className={classes.geoTitle}>{modeName}</p>
        ) : null}
        <p className={classes.readOnlyValue}>{formatRoomSettingsSummary(room, lang)}</p>
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
    if (field?.type === "checkbox") {
      parsed = Boolean(rawValue);
    }
    if (field?.type === "multiselect" || key === "continents" || key === "category") {
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

  const visibleFields = activeMode.settingsFields
    .filter((field) => fieldIsVisible(field, draftSettings))
    .filter((field) => !(isClassic && field.key === "variant"));

  if (isGeography) {
    const numberFields = visibleFields.filter((field) => field.type === "number");
    const checkboxFields = visibleFields.filter(
      (field) => field.type === "checkbox"
    );
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
            <SettingInfoTip
              text={
                continentsCopy?.hint ??
                "Limit the country pool to selected continents. Empty = all."
              }
            />
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
        </div>

        {checkboxFields.length ? (
          <div className={classes.geoChecks}>
            {checkboxFields.map((field) => {
              const locked = Boolean(field.premium) && !hostPremium;
              const fieldCopy = all.settings_fields?.[field.key];
              const label = fieldCopy?.label ?? field.label;
              const info = fieldCopy?.info ?? field.info;
              const fieldId = `${baseId}-${field.key}`;
              const checked = Boolean(draftSettings[field.key]);

              return (
                <label
                  key={field.key}
                  className={`${classes.checkRow} ${
                    locked ? classes.checkRowLocked : ""
                  }`}
                  htmlFor={fieldId}
                >
                  <input
                    id={fieldId}
                    type="checkbox"
                    className={classes.checkbox}
                    checked={checked}
                    disabled={locked}
                    onChange={(event) =>
                      onSettingChange(field.key, event.target.checked)
                    }
                  />
                  <span className={classes.checkTitle}>
                    <span className={classes.checkLabel}>{label}</span>
                    {field.premium ? (
                      <span className={classes.badge}>Premium</span>
                    ) : null}
                    <SettingInfoTip text={info} />
                  </span>
                </label>
              );
            })}
          </div>
        ) : null}

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
              "Premium host unlocks continent filters, map modifiers, lives, and longer games."}{" "}
            <Link href={`/profile?lang=${lang}`} className={classes.premiumLink}>
              {t.upgradeLink ?? "Upgrade"}
            </Link>
          </p>
        ) : null}
      </div>
    );
  }

  if (isClassic) {
    const numberFields = visibleFields.filter((field) => field.type === "number");
    const selectFields = visibleFields.filter(
      (field) =>
        field.type === "select" &&
        field.key !== "variant" &&
        field.key !== "category"
    );
    const checkboxFields = visibleFields.filter(
      (field) => field.type === "checkbox"
    );
    const categoryCopy = all.settings_fields?.category;
    const categoryField = visibleFields.find((field) => field.key === "category");
    const categoryLabels = Object.fromEntries(
      CLASSIC_CATEGORIES.map((id) => [
        id,
        categoryCopy?.options?.[id] ?? formatCategoryLabel(id),
      ])
    );

    return (
      <div className={`${classes.form} ${classes.geoForm}`}>
        <p className={classes.formLabel}>{t.gameSetup ?? "Game setup"}</p>
        <h3 className={classes.geoTitle}>{modeName}</h3>

        {categoryField ? (
          <div className={classes.geoContinents}>
            <span className={classes.fieldLabel}>
              {categoryCopy?.label ?? "Categories"}
              <span className={classes.badge}>Premium</span>
              <SettingInfoTip
                text={
                  categoryCopy?.hint ??
                  "Limit the trivia bank to selected categories. Empty = all."
                }
              />
            </span>
            <CategoryCardPicker
              multi
              value={normalizeCategorySetting(draftSettings.category)}
              onChange={(next) => onSettingChange("category", next)}
              disabled={!hostPremium}
              allLabel={categoryCopy?.all ?? "All categories"}
              ariaLabel={categoryCopy?.label ?? "Categories"}
              optionLabels={categoryLabels}
            />
          </div>
        ) : null}

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

        {selectFields.map((field) => {
          const locked = Boolean(field.premium) && !hostPremium;
          const fieldCopy = all.settings_fields?.[field.key];
          const label = fieldCopy?.label ?? field.label;
          const hint = fieldCopy?.hint ?? field.hint;
          return (
            <label
              key={field.key}
              className={`${classes.field} ${locked ? classes.checkRowLocked : ""}`}
            >
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
                  <option key={option.value} value={option.value}>
                    {optionLabel(field.key, option.value, all, option.label)}
                  </option>
                ))}
              </select>
              {hint ? <span className={classes.hint}>{hint}</span> : null}
            </label>
          );
        })}

        {checkboxFields.length ? (
          <div className={classes.geoChecks}>
            {checkboxFields.map((field) => {
              const locked = Boolean(field.premium) && !hostPremium;
              const fieldCopy = all.settings_fields?.[field.key];
              const label = fieldCopy?.label ?? field.label;
              const info = fieldCopy?.info ?? field.info;
              const fieldId = `${baseId}-${field.key}`;
              return (
                <label
                  key={field.key}
                  className={`${classes.checkRow} ${
                    locked ? classes.checkRowLocked : ""
                  }`}
                  htmlFor={fieldId}
                >
                  <input
                    id={fieldId}
                    type="checkbox"
                    className={classes.checkbox}
                    checked={Boolean(draftSettings[field.key])}
                    disabled={locked}
                    onChange={(event) =>
                      onSettingChange(field.key, event.target.checked)
                    }
                  />
                  <span className={classes.checkLabel}>
                    {label}
                    {field.premium ? (
                      <span className={classes.badge}>Premium</span>
                    ) : null}
                    {info ? <SettingInfoTip text={info} /> : null}
                  </span>
                </label>
              );
            })}
          </div>
        ) : null}

        {!hostPremium ? (
          <p className={classes.premiumHint}>
            {t.premiumClassicHint ??
              "Premium host unlocks difficulty, scoring rules, buzzer race, host pacing, pulpit styles, sound effects, categories, and longer games."}{" "}
            <Link href={`/profile?lang=${lang}`} className={classes.premiumLink}>
              {t.upgradeLink ?? "Upgrade"}
            </Link>
          </p>
        ) : null}
      </div>
    );
  }

  if (isUndercover) {
    const groups = UNDERCOVER_SETTING_GROUPS.map((group) => ({
      ...group,
      fields: visibleFields.filter((field) => field.group === group.id),
    })).filter((group) => group.fields.length > 0);

    const groupSummary = (groupId, fields) => {
      if (groupId === "roles") {
        return fields
          .filter((field) => field.type === "number")
          .map((field) => {
            const fieldCopy = all.settings_fields?.[field.key];
            const short =
              fieldCopy?.short ?? fieldCopy?.label ?? field.label ?? field.key;
            const value =
              draftSettings[field.key] ??
              activeMode.defaultSettings?.[field.key] ??
              0;
            return `${value} ${short}`;
          })
          .join(" · ");
      }
      if (groupId === "round") {
        const rounds =
          draftSettings.totalRounds ??
          activeMode.defaultSettings?.totalRounds ??
          3;
        const clue =
          draftSettings.clueTimeSeconds ??
          activeMode.defaultSettings?.clueTimeSeconds ??
          0;
        const vote =
          draftSettings.voteTimeSeconds ??
          activeMode.defaultSettings?.voteTimeSeconds ??
          0;
        return `${rounds} rounds · clue ${clue ? `${clue}s` : "—"} · vote ${
          vote ? `${vote}s` : "—"
        }`;
      }
      if (groupId === "flow") {
        return (
          optionLabel(
            "discussionMode",
            draftSettings.discussionMode ??
              activeMode.defaultSettings?.discussionMode ??
              "off",
            all,
            "Off"
          ) ?? "Off"
        );
      }
      if (groupId === "clues") {
        const on = fields.filter(
          (field) =>
            field.type === "checkbox" && Boolean(draftSettings[field.key])
        ).length;
        return on ? `${on} on` : "defaults";
      }
      return null;
    };

    const renderGroupedField = (field) => {
      if (field.type === "number") {
        return renderNumberField({
          field,
          draftSettings,
          hostPremium,
          baseId,
          all,
          onSettingChange,
          hintAsTip: true,
        });
      }

      if (field.type === "select") {
        const locked = Boolean(field.premium) && !hostPremium;
        const fieldCopy = all.settings_fields?.[field.key];
        const label = fieldCopy?.label ?? field.label;
        const tip = fieldCopy?.info ?? fieldCopy?.hint ?? field.hint;
        const fieldId = `${baseId}-${field.key}`;

        return (
          <label
            key={field.key}
            className={`${classes.field} ${locked ? classes.checkRowLocked : ""}`}
          >
            <span className={classes.fieldLabel}>
              {label}
              {field.premium ? (
                <span className={classes.badge}>Premium</span>
              ) : null}
              {tip ? <SettingInfoTip text={tip} /> : null}
            </span>
            <select
              id={fieldId}
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
          </label>
        );
      }

      if (field.type === "checkbox") {
        const locked = Boolean(field.premium) && !hostPremium;
        const fieldCopy = all.settings_fields?.[field.key];
        const label = fieldCopy?.label ?? field.label;
        const tip =
          fieldCopy?.info ?? fieldCopy?.hint ?? field.info ?? field.hint;
        const fieldId = `${baseId}-${field.key}`;
        const checked = Boolean(draftSettings[field.key]);

        return (
          <label
            key={field.key}
            className={`${classes.checkRow} ${
              locked ? classes.checkRowLocked : ""
            }`}
            htmlFor={fieldId}
          >
            <input
              id={fieldId}
              type="checkbox"
              className={classes.checkbox}
              checked={checked}
              disabled={locked}
              onChange={(event) =>
                onSettingChange(field.key, event.target.checked)
              }
            />
            <span className={classes.checkTitle}>
              <span className={classes.checkLabel}>{label}</span>
              {field.premium ? (
                <span className={classes.badge}>Premium</span>
              ) : null}
              {tip ? <SettingInfoTip text={tip} /> : null}
            </span>
          </label>
        );
      }

      return null;
    };

    return (
      <div className={`${classes.form} ${classes.geoForm} ${classes.undercoverForm}`}>
        <p className={classes.formLabel}>{t.gameSetup ?? "Game setup"}</p>
        <h3 className={classes.geoTitle}>{modeName}</h3>

        <div className={classes.settingsGroups}>
          {groups.map((group) => {
            const groupCopy = all.settings_fields?.[group.id];
            const title = groupCopy?.label ?? group.fallbackLabel;
            const summary = groupSummary(group.id, group.fields);
            const open = openSettingsGroup === group.id;

            return (
              <ExpandablePanel
                key={group.id}
                title={title}
                summary={summary}
                icon={<SettingsGroupIcon groupId={group.id} />}
                open={open}
                onOpenChange={(next) =>
                  setOpenSettingsGroup(next ? group.id : null)
                }
              >
                <div className={classes.groupFields}>
                  {group.fields.map((field) => renderGroupedField(field))}
                </div>
              </ExpandablePanel>
            );
          })}
        </div>

        {!hostPremium ? (
          <p className={classes.premiumHint}>
            {t.premiumUndercoverHint ??
              "Premium host unlocks Fool, Detective, blank rounds, speed resolve, sound effects, and up to 10 rounds."}{" "}
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
