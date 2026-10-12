"use client";

import { useEffect, useState } from "react";
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
  defaultName = "",
  defaultRoomCode = "",
  defaultAnimation = DEFAULT_ANIMATION,
  lang = "en",
}) {
  const [animation, setAnimation] = useState(defaultAnimation || DEFAULT_ANIMATION);
  const [name, setName] = useState(defaultName || "");
  const [roomCode, setRoomCode] = useState(
    String(defaultRoomCode || "")
      .trim()
      .toUpperCase()
      .slice(0, 6)
  );
  const t = getTranslations(lang).play;

  useEffect(() => {
    if (defaultName) setName(defaultName);
  }, [defaultName]);

  useEffect(() => {
    if (defaultAnimation) setAnimation(defaultAnimation);
  }, [defaultAnimation]);

  useEffect(() => {
    if (!defaultRoomCode) return;
    setRoomCode(
      String(defaultRoomCode)
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6)
    );
  }, [defaultRoomCode]);

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
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            value={roomCode}
            onChange={(e) =>
              setRoomCode(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 6)
              )
            }
            autoComplete="off"
            spellCheck={false}
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
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <Button type="submit" variant="secondary" disabled={!connected}>
          {t.joinRoom}
        </Button>
      </form>
    </section>
  );
}
