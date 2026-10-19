"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import classes from "./QuizLobby.module.css";
import Button from "@/components/button/Button";
import { getTranslations } from "@/lib/i18n";

export default function QuizLobby({
  onCreate,
  onJoin,
  connected,
  connectionError,
  defaultMode,
  defaultName = "",
  defaultRoomCode = "",
  isSignedIn = false,
  lang = "en",
  variant = "default",
}) {
  const [name, setName] = useState(defaultName || "");
  const [roomCode, setRoomCode] = useState(
    String(defaultRoomCode || "")
      .trim()
      .toUpperCase()
      .slice(0, 6)
  );
  const t = getTranslations(lang).play;
  const geo = variant === "geo";
  const classic = variant === "classic";
  const immersive = geo || classic;

  useEffect(() => {
    if (defaultName) setName(defaultName);
  }, [defaultName]);

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

  const panelClass = [
    classes.panel,
    geo ? classes.geoPanel : "",
    classic ? classes.classicPanel : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={panelClass}>
      <h2 className={classes.heading}>{t.joinHeading}</h2>
      {defaultMode && !immersive ? (
        <p className={classes.hint}>
          {t.newRoomsStart}{" "}
          <strong>
            {defaultMode === "geography"
              ? t.geographyLabel
              : defaultMode === "picture"
                ? t.pictureLabel ?? "Picture Round"
                : t.classicLabel}
          </strong>
          . {t.modeLockedFromHome ?? "Mode settings are chosen in the waiting room."}
        </p>
      ) : null}
      {geo ? (
        <p className={classes.hint}>
          <strong>{t.geographyLabel}</strong>
          {" — "}
          {t.modeLockedFromHome ?? "Mode settings are chosen in the waiting room."}
        </p>
      ) : null}
      {classic ? (
        <p className={classes.hint}>
          <strong>
            {defaultMode === "picture"
              ? t.pictureLabel ?? "Picture Round"
              : t.classicLabel}
          </strong>
          {" — "}
          {t.modeLockedFromHome ?? "Mode settings are chosen in the waiting room."}
          {" "}
          {t.speedScoringHint ??
            "Faster correct answers earn more points."}
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

      <p className={classes.hint}>
        {isSignedIn
          ? t.avatarFromProfile ??
            "Your victory emote and skin come from your profile."
          : t.avatarGuestDefault ??
            "Guests use the default avatar. Sign in to set a victory emote and skin."}{" "}
        {isSignedIn ? (
          <Link href={`/profile?lang=${lang}`} className={classes.profileLink}>
            {t.editAvatarProfile ?? "Edit on profile"}
          </Link>
        ) : null}
      </p>

      <form
        className={classes.form}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          onCreate(String(data.get("name") || ""), defaultMode);
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
          onJoin(
            String(data.get("roomCode") || ""),
            String(data.get("name") || "")
          );
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
