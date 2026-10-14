"use client";

import dynamic from "next/dynamic";
import { DEFAULT_VICTORY_ANIMATION, VICTORY_ANIMATIONS } from "@/lib/quiz/animations";
import {
  CHARACTER_SKINS,
  DEFAULT_SKIN,
  FREE_VICTORY_ANIMATIONS,
  canUseVictoryAnimation,
  canUseSkin,
} from "@/lib/quiz/cosmetics";
import styles from "./AvatarPicker.module.css";

const AvatarScene = dynamic(() => import("@/components/avatar/AvatarScene"), {
  ssr: false,
  loading: () => <div className={styles.previewLoading}>Loading avatar preview…</div>,
});

export default function AvatarPicker({
  value = DEFAULT_VICTORY_ANIMATION,
  onChange,
  skinKey = DEFAULT_SKIN,
  onSkinChange,
  plan = "free",
  unlockedCosmetics = [],
  victoryLabel = "Victory emote",
  skinLabel = "Character skin",
}) {
  const access = { plan, unlockedCosmetics };

  return (
    <div className={styles.wrapper}>
      <AvatarScene
        animation={value}
        skinKey={skinKey}
        className={styles.preview}
        restoreIdleAfterPreview={false}
      />
      <label className={styles.label}>
        {victoryLabel}
        <select
          className={styles.select}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {VICTORY_ANIMATIONS.map((anim) => {
            const allowed = canUseVictoryAnimation(anim, access);
            const free = FREE_VICTORY_ANIMATIONS.includes(anim);
            return (
              <option key={anim} value={anim} disabled={!allowed}>
                {anim}
                {!free ? (allowed ? " ★" : " (Premium / credits)") : ""}
              </option>
            );
          })}
        </select>
      </label>
      {typeof onSkinChange === "function" ? (
        <label className={styles.label}>
          {skinLabel}
          <select
            className={styles.select}
            value={skinKey}
            onChange={(e) => onSkinChange(e.target.value)}
          >
            {CHARACTER_SKINS.map((skin) => {
              const allowed = canUseSkin(skin.id, access);
              let suffix = "";
              if (!skin.free && !allowed) {
                suffix = skin.earnOnly
                  ? ` (${skin.creditCost} credits · play to earn)`
                  : ` (${skin.creditCost} credits / Premium)`;
              } else if (!skin.free && allowed && skin.earnOnly) {
                suffix = " ★";
              } else if (!skin.free && allowed) {
                suffix = " ★";
              }
              return (
                <option key={skin.id} value={skin.id} disabled={!allowed}>
                  {skin.label}
                  {suffix}
                </option>
              );
            })}
          </select>
        </label>
      ) : null}
    </div>
  );
}
