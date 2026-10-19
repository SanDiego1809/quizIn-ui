"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { getTranslations } from "@/lib/i18n";
import { getCapitalLabel, getCountryLabel } from "@/lib/quiz/geoLabels";
import LiveRanking from "./LiveRanking";
import classes from "./GeoQuizQuestion.module.css";

const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });

function formatCountdown(deadline) {
  if (!deadline) return null;
  const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  return `${seconds}s`;
}

function fill(template, vars) {
  return String(template ?? "").replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : ""
  );
}

function flagUrl(countryCode) {
  const code = String(countryCode || "").trim().toLowerCase();
  if (!code) return null;
  return `https://flagcdn.com/w320/${code}.png`;
}

export default function GeoQuizQuestion({ room, onSubmit, lang = "en" }) {
  const [countdown, setCountdown] = useState(null);
  const [pendingCode, setPendingCode] = useState(null);
  const questionNumber = (room.currentQuestionIndex ?? 0) + 1;
  const t = getTranslations(lang).geoQuestion;
  const isReveal = room.phase === "reveal";
  const variant =
    room.question?.variant ||
    room.settings?.variant ||
    "countries";
  const isFlags = variant === "flags";
  const isCapitals = variant === "capitals";
  const isTeams = variant === "teams" || variant === "versus";
  const flagSrc = isFlags ? flagUrl(room.question?.countryCode) : null;
  const yourTeam = room.teams?.find((team) => team.id === room.yourTeamId);
  const flags = room.settingsFlags || {};
  const youEliminated = Boolean(room.youEliminated);
  const showLives =
    flags.lives ||
    room.settings?.variant === "streak" ||
    room.yourLives != null;

  const yourGuess = room.yourGuess || pendingCode || null;
  const correctCode = isReveal
    ? room.reveal?.correctCode || room.question?.countryCode || null
    : null;
  const wrongCode =
    isReveal &&
    yourGuess &&
    correctCode &&
    String(yourGuess).toLowerCase() !== String(correctCode).toLowerCase()
      ? yourGuess
      : null;

  const highlightCodes = useMemo(() => {
    if (!isReveal || !flags.revealHeat || !room.reveal?.clicks) return [];
    const correct = String(correctCode || "").toLowerCase();
    const mine = String(yourGuess || "").toLowerCase();
    return room.reveal.clicks
      .map((click) => String(click.countryCode || "").toLowerCase())
      .filter(
        (code) => code && code !== correct && code !== mine
      );
  }, [isReveal, flags.revealHeat, room.reveal, correctCode, yourGuess]);

  useEffect(() => {
    setPendingCode(null);
  }, [room.currentQuestionIndex]);

  useEffect(() => {
    if (!room.phaseDeadline) {
      setCountdown(null);
      return undefined;
    }

    const tick = () => setCountdown(formatCountdown(room.phaseDeadline));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [room.phaseDeadline]);

  function handleSelectCountry(code) {
    if (isReveal || room.hasAnswered || youEliminated) return;
    setPendingCode(code);
    onSubmit(code);
  }

  const countryCode = room.question?.countryCode;
  const localizedCountry = getCountryLabel(
    countryCode,
    lang,
    room.question?.countryName
  );
  const localizedCapital = getCapitalLabel(
    countryCode,
    lang,
    room.question?.capitalName
  );

  let promptText = t.prompt;
  let promptValue = localizedCountry;
  let hintText = t.hint;

  if (isReveal) {
    promptText = t.revealTitle ?? "Round reveal";
    promptValue = localizedCountry;
    if (wrongCode) {
      hintText =
        t.revealMiss ??
        "Your pick is red — the correct country is green.";
    } else if (yourGuess) {
      hintText = t.revealHit ?? "Correct!";
    } else {
      hintText = t.revealHint ?? "The correct country is highlighted.";
    }
  } else if (youEliminated) {
    hintText = t.youAreOut ?? "You're out — watch the rest of the game.";
  } else if (room.hasAnswered || yourGuess) {
    hintText = fill(t.waitingPick ?? t.waiting, {
      answered: room.answeredCount,
      total: room.players.length,
    });
  } else if (isFlags) {
    promptText = t.promptFlag ?? t.prompt;
    promptValue = null;
    hintText = t.hintFlag ?? t.hint;
  } else if (isCapitals) {
    promptText = t.promptCapital ?? t.prompt;
    promptValue = localizedCapital || localizedCountry;
    hintText = t.hintCapital ?? t.hint;
  } else if (isTeams) {
    promptText = t.prompt;
    promptValue = localizedCountry;
    hintText = t.hintTeams ?? t.hintVersus ?? t.hint;
  }

  const mapDisabled =
    isReveal || room.hasAnswered || Boolean(yourGuess) || youEliminated;

  return (
    <section className={classes.stage}>
      <header className={classes.header}>
        <span className={classes.progress}>
          {fill(t.progress, {
            current: questionNumber,
            total: room.totalQuestions,
          })}
        </span>
        {showLives && room.yourLives != null && !youEliminated ? (
          <span className={classes.lives}>
            {fill(t.livesLeft ?? "Lives: {count}", { count: room.yourLives })}
          </span>
        ) : null}
        {countdown ? <span className={classes.timer}>{countdown}</span> : null}
      </header>

      {isTeams && yourTeam ? (
        <p
          className={`${classes.teamBanner} ${
            yourTeam.id === "red" ? classes.teamBannerRed : classes.teamBannerBlue
          }`}
        >
          {(t.yourTeam ?? "Your team: {team}").replace(
            "{team}",
            yourTeam.id === "red"
              ? t.teamRed ?? yourTeam.name
              : t.teamBlue ?? yourTeam.name
          )}
        </p>
      ) : null}

      {youEliminated ? (
        <p className={classes.outBanner}>
          {t.youAreOut ?? "You're out — watch the rest of the game."}
        </p>
      ) : null}

      <div className={classes.promptBlock}>
        <h2 className={classes.question}>
          {promptText}
          {promptValue ? (
            <>
              {" "}
              <span className={classes.countryName}>{promptValue}</span>
            </>
          ) : null}
        </h2>
        {!isReveal && flagSrc ? (
          <img
            className={classes.flag}
            src={flagSrc}
            alt={t.flagAlt ?? "Country flag"}
            width={320}
            height={213}
            decoding="async"
          />
        ) : null}
      </div>

      <div className={classes.mapArea}>
        <LiveRanking
          players={room.players || []}
          scores={room.scores || {}}
          yourPlayerId={room.yourPlayerId}
          eliminatedPlayerIds={room.eliminatedPlayerIds || []}
          phase={room.phase}
          label={t.liveRanking ?? "Ranking"}
          youLabel={t.youTag ?? "you"}
        />
        <WorldMap
          onSelectCountry={handleSelectCountry}
          disabled={mapDisabled}
          pendingCode={!isReveal ? yourGuess : null}
          silhouette={Boolean(flags.silhouette)}
          highlightCodes={highlightCodes}
          correctCode={correctCode}
          wrongCode={wrongCode}
        />
      </div>

      <p className={classes.hint}>{hintText}</p>
    </section>
  );
}
