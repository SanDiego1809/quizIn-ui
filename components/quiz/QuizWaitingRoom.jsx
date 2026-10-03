"use client";

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
  const t = getTranslations(lang).play;

  return (
    <section className={classes.panel}>
      <div className={classes.codeBlock}>
        <span className={classes.codeLabel}>{t.roomCode}</span>
        <strong className={classes.code}>{room.roomCode}</strong>
      </div>

      <h2 className={classes.heading}>{inLobby ? t.waitingForPlayers : t.gameInProgress}</h2>

      <ul className={classes.playerList}>
        {room.players.map((player) => (
          <li key={player.id} className={classes.player}>
            <span className={classes.playerName}>
              {player.name}
              {player.isHost ? ` (${t.hostTag})` : ""}
            </span>
            {player.animation ? (
              <span className={classes.playerAnimation}>{player.animation}</span>
            ) : null}
          </li>
        ))}
      </ul>

      {inLobby ? (
        <QuizRoomSettings room={room} isHost={isHost} onUpdateConfig={onUpdateConfig} lang={lang} />
      ) : null}

      {inLobby && isHost ? (
        <Button onClick={() => onStart()}>
          {t.start} {formatRoomSettingsSummary(room, lang)}
        </Button>
      ) : null}

      {!inLobby && isHost ? (
        <Button variant="secondary" onClick={onReset}>
          Back to lobby
        </Button>
      ) : null}

      {inLobby && !isHost ? <p className={classes.hint}>{t.waitingForHost}</p> : null}
    </section>
  );
}
