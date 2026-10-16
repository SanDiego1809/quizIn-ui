"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getTranslations } from "@/lib/i18n";
import { getCapitalLabel, getCountryLabel } from "@/lib/quiz/geoLabels";
import classes from "./GeoQuizQuestion.module.css";

// d3-geo touches the DOM-free geometry math only, but we still load it
// on the client only to keep it out of the server bundle and to match
// the pattern already used for the (three.js based) avatar room.
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
  const variant =
    room.question?.variant ||
    room.settings?.variant ||
    "countries";
  const isFlags = variant === "flags";
  const isCapitals = variant === "capitals";
  const isTeams = variant === "teams" || variant === "versus";
  const flagSrc = isFlags ? flagUrl(room.question?.countryCode) : null;
  const yourTeam = room.teams?.find((team) => team.id === room.yourTeamId);

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
    if (room.hasAnswered) return;
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

  if (isFlags) {
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

  return (
    <section className={classes.stage}>
      <header className={classes.header}>
        <span className={classes.progress}>
          {fill(t.progress, {
            current: questionNumber,
            total: room.totalQuestions,
          })}
        </span>
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
        {flagSrc ? (
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
        <WorldMap
          onSelectCountry={handleSelectCountry}
          disabled={room.hasAnswered}
          pendingCode={pendingCode}
        />
      </div>

      <p className={classes.hint}>
        {room.hasAnswered
          ? fill(t.waiting, {
              answered: room.answeredCount,
              total: room.players.length,
            })
          : hintText}
      </p>
    </section>
  );
}
