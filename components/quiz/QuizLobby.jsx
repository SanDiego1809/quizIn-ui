"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import classes from "./QuizLobby.module.css";
import Button from "@/components/button/Button";
import { DEFAULT_ANIMATION } from "@/lib/quiz/animations";
import { getTranslations } from "@/lib/i18n";

const AvatarPicker = dynamic(() => import("@/components/avatar/AvatarPicker"), {
  ssr: false,
  loading: () => <div className={classes.avatarLoading}>Loading avatar preview…</div>,
});

export default function QuizLobby({
  onCreate,
  onJoin,
  connected,
  connectionError,
  defaultMode,
  lang = "en",
}) {
  const [animation, setAnimation] = useState(DEFAULT_ANIMATION);
  const t = getTranslations(lang).play;

  return (
    <section className={classes.panel}>
      <h2 className={classes.heading}>{t.joinHeading}</h2>
      {defaultMode ? (
        <p className={classes.hint}>
          {t.newRoomsStart}{" "}
          <strong>{defaultMode === "geography" ? t.geographyLabel : t.classicLabel}</strong>{" "}
          mode (host can change before starting).
        </p>
      ) : null}
      {connected ? (
        <p className={classes.statusOk}>{t.connected}</p>
      ) : connectionError ? (
        <p className={classes.statusError} role="alert">
          {connectionError}
        </p>
      ) : (
        <p className={classes.hint}>{t.connecting}</p>
      )}

      <AvatarPicker value={animation} onChange={setAnimation} />

      <form
        className={classes.form}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          onCreate(String(data.get("name") || ""), animation, defaultMode);
        }}
      >
        <label className={classes.label}>
          {t.yourName}
          <input
            name="name"
            className={classes.input}
            placeholder={t.namePlaceholder}
            maxLength={30}
            required
          />
        </label>
        <Button type="submit" disabled={!connected}>
          {t.createRoom}
        </Button>
      </form>

      <div className={classes.divider}>{t.divider}</div>

      <form
        className={classes.form}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          onJoin(String(data.get("roomCode") || ""), String(data.get("name") || ""), animation);
        }}
      >
        <label className={classes.label}>
          {t.roomCode}
          <input
            name="roomCode"
            className={classes.input}
            placeholder={t.roomCodePlaceholder}
            maxLength={6}
            required
          />
        </label>
        <label className={classes.label}>
          {t.yourName}
          <input
            name="name"
            className={classes.input}
            placeholder={t.namePlaceholder}
            maxLength={30}
            required
          />
        </label>
        <Button type="submit" variant="secondary" disabled={!connected}>
          {t.joinRoom}
        </Button>
      </form>
    </section>
  );
}
