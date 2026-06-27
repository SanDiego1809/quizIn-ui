"use client";

import dynamic from "next/dynamic";
import { ANIMATIONS, DEFAULT_ANIMATION } from "@/lib/quiz/animations";
import styles from "./AvatarPicker.module.css";

const AvatarScene = dynamic(() => import("@/components/avatar/AvatarScene"), {
  ssr: false,
  loading: () => <div className={styles.previewLoading}>Loading avatar preview…</div>,
});

export default function AvatarPicker({ value, onChange }) {
  return (
    <div className={styles.wrapper}>
      <AvatarScene
        animation={value}
        className={styles.preview}
        onIdleRestore={() => onChange(DEFAULT_ANIMATION)}
      />
      <label className={styles.label}>
        Avatar animation
        <select
          className={styles.select}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {ANIMATIONS.map((anim) => (
            <option key={anim} value={anim}>
              {anim}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
