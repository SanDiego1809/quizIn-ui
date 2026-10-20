"use client";

import Link from "next/link";
import classes from "./QuizWaitingRoom.module.css";
import Button from "@/components/button/Button";
import SpaceButton from "@/components/button/SpaceButton";
import TvPlayButton from "@/components/button/TvPlayButton";
import TeamPicker from "@/components/team/TeamPicker";
import ExpandableModePicker from "@/components/quiz/ExpandableModePicker";
import QuizRoomSettings, {
  formatRoomSettingsSummary,
} from "@/components/quiz/QuizRoomSettings";
import geographyModePickerTheme from "@/components/quiz/modePickerThemes/geography";
import classicModePickerTheme from "@/components/quiz/modePickerThemes/classic";
import ContestantRow from "@/components/quiz/modes/classic/ContestantRow";
import { getTranslations } from "@/lib/i18n";
import {
  resolveAvailableModes,
  resolveRoomMode,
} from "@/lib/quiz/modes/registry";
import { isTeamsVariant } from "@/lib/quiz/teams";

function variantOptionLabel(value, all, fallbackLabel) {
  const options = all.settings_fields?.variant?.options;
  if (options && value != null && value !== "") {
    return options[value] ?? fallbackLabel;
  }
  return fallbackLabel ?? String(value ?? "");
}

export default function QuizWaitingRoom({
  room,
  isHost,
  onStart,
  onReset,
  onUpdateConfig,
  onPickTeam,
  lang = "en",
  variant = "default",
}) {
  const geoLobby = variant === "geoLobby";
  const classicLobby = variant === "classicLobby";
  const undercoverLobby = variant === "undercoverLobby";
  const immersiveLobby = geoLobby || classicLobby || undercoverLobby;
  const inLobby = room.phase === "lobby";
  const all = getTranslations(lang);
  const t = { ...all.settings, ...all.play };
  const roomMode = resolveRoomMode(room);
  const activeMode =
    resolveAvailableModes(room).find((mode) => mode.id === roomMode) ?? null;
  const variantField = activeMode?.settingsFields?.find(
    (field) => field.key === "variant"
  );
  const hostPremium = room.hostPlan === "premium";
  const variantOptions = (variantField?.options ?? []).map((option) => ({
    value: option.value,
    label: variantOptionLabel(option.value, all, option.label),
    premium: Boolean(option.premium),
  }));
  const showGeoModePicker =
    geoLobby && inLobby && isHost && roomMode === "geography";
  const showClassicModePicker =
    classicLobby &&
    inLobby &&
    isHost &&
    (roomMode === "classic" || roomMode === "picture");
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

  const roomCodeBlock = (
    <div className={classes.codeBlock}>
      <span className={classes.codeLabel}>{t.roomCode ?? "Room code"}</span>
      <strong className={classes.code}>{room.roomCode}</strong>
    </div>
  );

  const heading = (
    <h2 className={classes.heading}>
      {inLobby
        ? t.waitingForPlayers ?? "Waiting for players"
        : t.gameInProgress ?? "Game in progress"}
    </h2>
  );

  const seatBlock = (
    <>
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
    </>
  );

  const playerList = immersiveLobby ? (
    <ContestantRow
      players={room.players}
      maxSeats={seats?.max ?? Math.max(4, room.players.length)}
      yourPlayerId={room.yourPlayerId}
      hostTag={t.hostTag ?? "host"}
      emptyLabel={t.emptySeat ?? "Empty seat"}
      youLabel={t.youTag ?? all.results?.youTag ?? "you"}
      pulpitKit={room.settings?.pulpitKit || "gold"}
    />
  ) : (
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
  );

  const settingsBlock =
    inLobby ? (
      <QuizRoomSettings
        room={room}
        isHost={isHost}
        onUpdateConfig={onUpdateConfig}
        lang={lang}
      />
    ) : null;

  const teamsBlock =
    inLobby && teamsMode ? (
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
    ) : null;

  const playLabel = all.site?.play ?? "Play";
  const startControl =
    inLobby && isHost ? (
      classicLobby ? (
        <div className={classes.geoPlayWrap}>
          <TvPlayButton onClick={() => onStart()} disabled={startBlocked}>
            {playLabel}
          </TvPlayButton>
        </div>
      ) : immersiveLobby ? (
        <div className={classes.geoPlayWrap}>
          <SpaceButton onClick={() => onStart()} disabled={startBlocked}>
            {playLabel}
          </SpaceButton>
        </div>
      ) : (
        <Button onClick={() => onStart()} disabled={startBlocked}>
          {t.start ?? "Start"} {formatRoomSettingsSummary(room, lang)}
        </Button>
      )
    ) : null;

  const actionsBlock = (
    <>
      {startControl}

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
    </>
  );

  const onVariantChange = (nextVariant) => {
    if (typeof onUpdateConfig !== "function") return;
    const option = variantOptions.find((entry) => entry.value === nextVariant);
    if (option?.premium && !hostPremium) return;
    onUpdateConfig({
      settings: {
        ...(room.settings ?? activeMode?.defaultSettings ?? {}),
        variant: nextVariant,
      },
    });
  };

  if (immersiveLobby) {
    const leftPanelClass = [
      classes.panel,
      geoLobby ? classes.geoPanel : "",
      classicLobby ? classes.classicPanel : "",
      undercoverLobby ? classes.undercoverPanel : "",
    ]
      .filter(Boolean)
      .join(" ");
    const rightPanelClass = [
      classes.panel,
      geoLobby ? classes.geoPanel : "",
      classicLobby ? classes.classicPanel : "",
      undercoverLobby ? classes.undercoverPanel : "",
      classes.geoPanelRight,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <>
        <section className={leftPanelClass}>
          {roomCodeBlock}
          {heading}
          {seatBlock}
          {playerList}
          {classicLobby ? (
            <p className={classes.hint}>
              {t.speedScoringHint ??
                "Faster correct answers earn more points."}
            </p>
          ) : null}
        </section>
        <div className={classes.geoCenter}>
          {showGeoModePicker ? (
            <ExpandableModePicker
              value={
                room.settings?.variant ??
                activeMode?.defaultSettings?.variant ??
                "countries"
              }
              options={variantOptions}
              onChange={onVariantChange}
              placeholder={t.chooseMode ?? "Choose mode"}
              ariaLabel={t.chooseMode ?? "Choose mode"}
              theme={geographyModePickerTheme}
              hostPremium={hostPremium}
            />
          ) : null}
          {showClassicModePicker ? (
            <ExpandableModePicker
              value={
                room.settings?.variant ??
                activeMode?.defaultSettings?.variant ??
                "solo"
              }
              options={variantOptions}
              onChange={onVariantChange}
              placeholder={t.chooseMode ?? "Choose mode"}
              ariaLabel={t.chooseMode ?? "Choose mode"}
              theme={classicModePickerTheme}
              hostPremium={hostPremium}
            />
          ) : null}
        </div>
        <section className={rightPanelClass}>
          {settingsBlock}
          {teamsBlock}
          {actionsBlock}
        </section>
      </>
    );
  }

  return (
    <section className={classes.panel}>
      {roomCodeBlock}
      {heading}
      {seatBlock}
      {playerList}
      {settingsBlock}
      {teamsBlock}
      {actionsBlock}
    </section>
  );
}
