"use client";

import classes from "./QuizWaitingRoom.module.css";
import Button from "@/components/button/Button";
import QuizRoomSettings, {
  formatRoomSettingsSummary,
} from "@/components/quiz/QuizRoomSettings";

export default function QuizWaitingRoom({
  room,
  isHost,
  onStart,
  onReset,
  onUpdateConfig,
}) {
  const inLobby = room.phase === "lobby";

  return (
    <section className={classes.panel}>
      <div className={classes.codeBlock}>
        <span className={classes.codeLabel}>Room code</span>
        <strong className={classes.code}>{room.roomCode}</strong>
      </div>

      <h2 className={classes.heading}>
        {inLobby ? "Waiting for players" : "Game in progress"}
      </h2>

      <ul className={classes.playerList}>
        {room.players.map((player) => (
          <li key={player.id} className={classes.player}>
            <span className={classes.playerName}>
              {player.name}
              {player.isHost ? " (host)" : ""}
            </span>
            {player.animation ? (
              <span className={classes.playerAnimation}>{player.animation}</span>
            ) : null}
          </li>
        ))}
      </ul>

      {inLobby ? (
        <QuizRoomSettings
          room={room}
          isHost={isHost}
          onUpdateConfig={onUpdateConfig}
        />
      ) : null}

      {inLobby && isHost ? (
        <Button onClick={() => onStart()}>
          Start {formatRoomSettingsSummary(room)}
        </Button>
      ) : null}

      {!inLobby && isHost ? (
        <Button variant="secondary" onClick={onReset}>
          Back to lobby
        </Button>
      ) : null}

      {inLobby && !isHost ? (
        <p className={classes.hint}>Waiting for the host to start…</p>
      ) : null}
    </section>
  );
}
