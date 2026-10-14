"use client";

import Link from "next/link";
import classes from "./QuizWaitingRoom.module.css";
import Button from "@/components/button/Button";
import QuizRoomSettings, {
  formatRoomSettingsSummary,
} from "@/components/quiz/QuizRoomSettings";
import { getTranslations } from "@/lib/i18n";

export default function QuizWaitingRoom({
  room,
  isHost,
  onStart,
  onReset,
  onUpdateConfig,
  lang = "en",
}) {
  const inLobby = room.phase === "lobby";
  const all = getTranslations(lang);
  const t = { ...all.settings, ...all.play };
  const seats = room.seatInfo;
  const overCapacity = Boolean(seats?.overCapacity);

  return (
    <section className={classes.panel}>
      <div className={classes.codeBlock}>
        <span className={classes.codeLabel}>{t.roomCode ?? "Room code"}</span>
        <strong className={classes.code}>{room.roomCode}</strong>
      </div>

      <h2 className={classes.heading}>
        {inLobby
          ? t.waitingForPlayers ?? "Waiting for players"
          : t.gameInProgress ?? "Game in progress"}
      </h2>

      {seats ? (
        <p className={overCapacity ? classes.seatWarn : classes.seatInfo}>
          {(t.seatStatus ?? "{count} / {max} seats · {premium} Premium (+1 each)")
            .replace("{count}", String(seats.count))
            .replace("{max}", String(seats.max))
            .replace("{premium}", String(seats.premiumCount))}
          {seats.count >= seats.max && seats.max < seats.hardCap ? (
            <>
              {" "}
              <Link href={`/profile?lang=${lang}`} className={classes.seatLink}>
                {t.needPremiumSeat ?? "Need another Premium for a larger room"}
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      {overCapacity ? (
        <p className={classes.seatWarn} role="status">
          {t.overCapacity ??
            "Too many players for current Premium seats. Someone must leave or upgrade before starting."}
        </p>
      ) : null}

      <ul className={classes.playerList}>
        {room.players.map((player) => (
          <li key={player.id} className={classes.player}>
            <span className={classes.playerName}>
              {player.name}
              {player.isHost ? ` (${t.hostTag ?? "host"})` : ""}
              {player.plan === "premium" ? (
                <span className={classes.premiumTag}>Premium</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      {inLobby ? (
        <QuizRoomSettings room={room} isHost={isHost} onUpdateConfig={onUpdateConfig} lang={lang} />
      ) : null}

      {inLobby && isHost ? (
        <Button onClick={() => onStart()} disabled={overCapacity}>
          {t.start ?? "Start"} {formatRoomSettingsSummary(room, lang)}
        </Button>
      ) : null}

      {!inLobby && isHost ? (
        <Button variant="secondary" onClick={onReset}>
          {t.backToLobby ?? "Back to lobby"}
        </Button>
      ) : null}

      {inLobby && !isHost ? (
        <p className={classes.hint}>{t.waitingForHost ?? "Waiting for the host to start…"}</p>
      ) : null}
    </section>
  );
}
