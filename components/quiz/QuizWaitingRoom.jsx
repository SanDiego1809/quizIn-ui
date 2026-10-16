"use client";

import Link from "next/link";
import classes from "./QuizWaitingRoom.module.css";
import Button from "@/components/button/Button";
import TeamPicker from "@/components/team/TeamPicker";
import QuizRoomSettings, {
  formatRoomSettingsSummary,
} from "@/components/quiz/QuizRoomSettings";
import { getTranslations } from "@/lib/i18n";
import { isTeamsVariant } from "@/lib/quiz/teams";

export default function QuizWaitingRoom({
  room,
  isHost,
  onStart,
  onReset,
  onUpdateConfig,
  onPickTeam,
  lang = "en",
}) {
  const inLobby = room.phase === "lobby";
  const all = getTranslations(lang);
  const t = { ...all.settings, ...all.play };
  const seats = room.seatInfo;
  const overCapacity = Boolean(seats?.overCapacity);
  const teamsMode = isTeamsVariant(room.settings?.variant);
  const yourPlayer = room.players.find(
    (player) => player.id === room.yourPlayerId
  );
  const yourTeamKey = yourPlayer?.teamKey ?? null;
  const blueCount = room.players.filter((player) => player.teamKey === "blue")
    .length;
  const redCount = room.players.filter((player) => player.teamKey === "red")
    .length;
  const unassignedCount = room.players.filter(
    (player) => player.teamKey !== "blue" && player.teamKey !== "red"
  ).length;
  const teamsNotReady =
    teamsMode && (blueCount < 1 || redCount < 1 || unassignedCount > 0);
  const startBlocked = overCapacity || teamsNotReady;

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
        <QuizRoomSettings
          room={room}
          isHost={isHost}
          onUpdateConfig={onUpdateConfig}
          lang={lang}
        />
      ) : null}

      {inLobby && teamsMode ? (
        <>
          <TeamPicker
            players={room.players}
            yourPlayerId={room.yourPlayerId}
            yourTeamKey={yourTeamKey}
            onPickTeam={onPickTeam}
            labels={{
              pickYourTeam: t.pickYourTeam ?? "Pick your team",
              teamBlue: t.teamBlue ?? "Blue",
              teamRed: t.teamRed ?? "Red",
              joinTeam: t.joinTeam ?? "Tap to join",
            }}
          />
          <p className={classes.hint}>
            {teamsNotReady
              ? t.teamsNeedBothSides ??
                "Everyone must pick a team, and both Blue and Red need at least one player."
              : t.teamsReady ?? "Teams are ready — the host can start."}
          </p>
        </>
      ) : null}

      {inLobby && isHost ? (
        <Button onClick={() => onStart()} disabled={startBlocked}>
          {t.start ?? "Start"} {formatRoomSettingsSummary(room, lang)}
        </Button>
      ) : null}

      {!inLobby && isHost ? (
        <Button variant="secondary" onClick={onReset}>
          {t.backToLobby ?? "Back to lobby"}
        </Button>
      ) : null}

      {inLobby && !isHost ? (
        <p className={classes.hint}>
          {t.waitingForHost ?? "Waiting for the host to start…"}
        </p>
      ) : null}
    </section>
  );
}
