"use client";

import { useEffect, useMemo, useState } from "react";
import QuizLobby from "@/components/quiz/QuizLobby";
import QuizWaitingRoom from "@/components/quiz/QuizWaitingRoom";
import QuizResults from "@/components/quiz/QuizResults";
import NightCityBackground from "./NightCityBackground";
import UndercoverLobbyExtras from "./UndercoverLobbyExtras";
import { getTranslations } from "@/lib/i18n";
import { playQuizSfx } from "@/lib/quiz/quizSfx";
import classes from "./UndercoverModeView.module.css";

function formatCountdown(deadline) {
  if (!deadline) return null;
  const ms = Math.max(0, deadline - Date.now());
  const sec = Math.ceil(ms / 1000);
  return `${sec}s`;
}

function playerName(room, playerId) {
  return room.players?.find((p) => p.id === playerId)?.name || "…";
}

function roleLabel(t, role) {
  if (role === "undercover") return t.roleUndercover;
  if (role === "mr_white") return t.roleMrWhite;
  if (role === "civilian") return t.roleCivilian;
  if (role === "fool") return t.roleFool;
  if (role === "detective") return t.roleDetective;
  return role || "";
}

function winnerLabel(t, winner) {
  if (winner === "civilians") return t.winnerCivilians;
  if (winner === "undercover") return t.winnerUndercover;
  if (winner === "mr_white") return t.winnerMrWhite;
  return winner || "";
}

function phaseTitle(t, subPhase) {
  if (subPhase === "reveal") return t.phaseReveal || "Your card";
  if (subPhase === "clue") return t.phaseClue || "Clues";
  if (subPhase === "discuss") return t.phaseDiscuss || "Discussion";
  if (subPhase === "accuse") return t.phaseAccuse || "Accuse";
  if (subPhase === "vote") return t.phaseVote || "Vote";
  if (subPhase === "mrwhite_guess") return t.phaseMrWhite || "Mr White guess";
  return t.phaseResults || "Round results";
}

function achievementIds(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return Object.entries(raw)
    .filter(([, on]) => Boolean(on))
    .map(([key]) =>
      key
        .replace(/([A-Z])/g, "_$1")
        .replace(/^_/, "")
        .toLowerCase()
    );
}

function achievementLabel(t, id) {
  const key = `achievement_${id}`;
  return t[key] || id;
}

export default function UndercoverModeView({
  room = null,
  isHost = false,
  onStart,
  onReset,
  onRematch,
  onAction,
  onUpdateConfig,
  onCreate,
  onJoin,
  connected = false,
  connectionError = null,
  defaultName = "",
  defaultRoomCode = "",
  isSignedIn = false,
  lang = "en",
}) {
  const all = getTranslations(lang);
  const t = all.undercover || {};

  const isEntry = !room;
  const isLobby = room?.phase === "lobby";
  const showShell = isEntry || isLobby;
  const isPlaying = room?.phase === "playing";
  const isFinal = room?.phase === "final_results";

  const [clue, setClue] = useState("");
  const [voteTarget, setVoteTarget] = useState("");
  const [mrWhiteGuess, setMrWhiteGuess] = useState("");
  const [accuseTarget, setAccuseTarget] = useState("");
  const [peekTarget, setPeekTarget] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [revealOpen, setRevealOpen] = useState(false);

  useEffect(() => {
    if (!isLobby || !isHost || !onUpdateConfig) return;
    if (room?.settings?.wordLang === lang) return;
    onUpdateConfig({ settings: { wordLang: lang } });
  }, [isLobby, isHost, lang, onUpdateConfig, room?.settings?.wordLang]);

  function startWithPageLang() {
    onStart?.({ wordLang: lang });
  }

  function rematchWithPageLang() {
    onRematch?.({ wordLang: lang });
  }

  useEffect(() => {
    setClue("");
    setVoteTarget("");
    setMrWhiteGuess("");
    setAccuseTarget("");
    setPeekTarget("");
  }, [room?.subPhase, room?.currentRound, room?.activeCluePlayerId]);

  useEffect(() => {
    if (room?.subPhase === "reveal") {
      setRevealOpen(false);
      const id = setTimeout(() => setRevealOpen(true), 120);
      return () => clearTimeout(id);
    }
    setRevealOpen(false);
    return undefined;
  }, [room?.subPhase, room?.currentRound]);

  useEffect(() => {
    if (!room?.phaseDeadline) {
      setCountdown(null);
      return undefined;
    }
    const tick = () => setCountdown(formatCountdown(room.phaseDeadline));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [room?.phaseDeadline]);

  useEffect(() => {
    const event = room?.sfxEvent;
    if (!event?.id || !event?.at) return;
    playQuizSfx(event.id, Boolean(room.audioPack));
  }, [room?.sfxEvent?.id, room?.sfxEvent?.at, room?.audioPack]);

  const clueOrderNames = useMemo(() => {
    if (!room?.clueOrder?.length) return "";
    return room.clueOrder.map((id) => playerName(room, id)).join(" → ");
  }, [room]);

  const yourTurn =
    isPlaying &&
    room?.subPhase === "clue" &&
    room?.activeCluePlayerId === room?.yourPlayerId;

  const canVote =
    isPlaying &&
    room?.subPhase === "vote" &&
    room?.youAlive &&
    !room?.votes?.[room?.yourPlayerId];

  const isMrWhiteGuessing =
    isPlaying &&
    room?.subPhase === "mrwhite_guess" &&
    room?.yourRole === "mr_white";

  const showRole = Boolean(room?.yourRole);
  const hasWord = room?.yourWord != null && room?.yourWord !== "";
  const showNoWord =
    room?.yourRole === "mr_white" ||
    room?.isBlankRound ||
    (!hasWord && room?.yourWord === null);

  function submitClue(event) {
    event.preventDefault();
    if (!clue.trim()) return;
    onAction?.({ type: "clue_submit", clue: clue.trim() });
  }

  function submitVote(event) {
    event.preventDefault();
    if (!voteTarget) return;
    onAction?.({ type: "vote_submit", targetPlayerId: voteTarget });
  }

  function submitGuess(event) {
    event.preventDefault();
    if (!mrWhiteGuess.trim()) return;
    onAction?.({ type: "mrwhite_guess_submit", guess: mrWhiteGuess.trim() });
  }

  function handleNextRound() {
    if (room?.roundResult?.isGameOver) {
      onAction?.({ type: "finish_match" });
      return;
    }
    onAction?.({ type: "round_next" });
  }

  const aliveSet = new Set(room?.alivePlayerIds || []);

  return (
    <>
      {showShell ? (
        <div className={classes.shell}>
          <NightCityBackground />
          <div
            className={`${classes.overlay} ${
              isEntry ? classes.overlayEntry : classes.overlayLobby
            }`}
          >
            {isEntry ? (
              <QuizLobby
                variant="undercover"
                connected={connected}
                connectionError={connectionError}
                onCreate={onCreate}
                onJoin={onJoin}
                defaultMode="undercover"
                defaultName={defaultName}
                defaultRoomCode={defaultRoomCode}
                isSignedIn={isSignedIn}
                lang={lang}
              />
            ) : (
              <>
                <QuizWaitingRoom
                  room={room}
                  isHost={isHost}
                  onStart={startWithPageLang}
                  onReset={onReset}
                  onUpdateConfig={onUpdateConfig}
                  lang={lang}
                  variant="undercoverLobby"
                />
                <UndercoverLobbyExtras
                  room={room}
                  isHost={isHost}
                  onUpdateConfig={onUpdateConfig}
                  t={t}
                />
              </>
            )}
          </div>
        </div>
      ) : null}

      {isPlaying ? (
        <div className={classes.shell}>
          <div className={classes.playRoot}>
            <header className={classes.topBar}>
              <h2 className={classes.phaseTitle}>
                {phaseTitle(t, room.subPhase)}
              </h2>
              <p className={classes.meta}>
                {(t.roundMeta || "Round {current} / {total}")
                  .replace("{current}", String(room.currentRound || 0))
                  .replace("{total}", String(room.totalRounds || 0))}
                {countdown ? (
                  <>
                    {" · "}
                    <span className={classes.countdown}>{countdown}</span>
                  </>
                ) : null}
              </p>
            </header>

            {room.isBlankRound ? (
              <p className={classes.blankBanner} role="status">
                {t.blankRoundBanner ||
                  "Blank round — no one has a word. Bluff."}
              </p>
            ) : null}

            <div className={classes.windowStrip} aria-label="Players">
              {(room.players || []).map((p) => {
                const alive = aliveSet.has(p.id);
                return (
                  <div
                    key={p.id}
                    className={`${classes.seat}${
                      alive ? "" : ` ${classes.seatOut}`
                    }${
                      p.id === room.yourPlayerId ? ` ${classes.seatYou}` : ""
                    }`}
                    title={p.name}
                  >
                    <span className={classes.seatName}>{p.name}</span>
                  </div>
                );
              })}
            </div>

            <aside
              className={`${classes.secret}${
                room.subPhase === "reveal"
                  ? ` ${classes.secretReveal}${
                      revealOpen ? ` ${classes.secretRevealOpen}` : ""
                    }`
                  : ""
              }`}
              aria-live="polite"
            >
              <p className={classes.secretLabel}>
                {showRole
                  ? t.yourSecret || "Your secret"
                  : t.yourWord || "Your word"}
              </p>
              {showRole ? (
                <p className={classes.secretRole}>
                  {roleLabel(t, room.yourRole)}
                </p>
              ) : null}
              <p className={classes.secretWord}>
                {showNoWord ? t.noWord || "No word" : room.yourWord || "—"}
              </p>
            </aside>

            {!room.youAlive && room.subPhase !== "round_results" ? (
              <p className={classes.outHint}>
                {t.youAreOut ||
                  "You're out for this round — watch the others."}
              </p>
            ) : null}

            {room.canDetectivePeek ? (
              <section className={classes.panel}>
                <div className={classes.formRow}>
                  <select
                    className={classes.input}
                    value={peekTarget}
                    onChange={(e) => setPeekTarget(e.target.value)}
                  >
                    <option value="">—</option>
                    {(room.alivePlayerIds || [])
                      .filter((id) => id !== room.yourPlayerId)
                      .map((id) => (
                        <option key={id} value={id}>
                          {playerName(room, id)}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    className={classes.button}
                    disabled={!peekTarget}
                    onClick={() =>
                      onAction?.({
                        type: "detective_peek",
                        targetPlayerId: peekTarget,
                      })
                    }
                  >
                    {t.peek || "Peek"}
                  </button>
                </div>
              </section>
            ) : null}

            {room.detectivePeekResult ? (
              <p className={classes.outHint}>
                {(room.detectivePeekResult.result === "special"
                  ? t.peekResultSpecial
                  : t.peekResultCivilian || "{name}"
                ).replace(
                  "{name}",
                  playerName(room, room.detectivePeekResult.targetPlayerId)
                )}
              </p>
            ) : null}

            {room.subPhase === "reveal" ? (
              <p className={classes.outHint}>
                {t.phaseReveal || "Your card"}
              </p>
            ) : null}

            {room.subPhase === "clue" ? (
              <section className={classes.panel}>
                <p className={classes.turnStrip}>
                  {(t.turnOrder || "Order: {order}").replace(
                    "{order}",
                    clueOrderNames
                  )}
                </p>
                <p className={classes.turnStrip}>
                  {yourTurn
                    ? t.yourTurn || "Your turn — give a short clue."
                    : (t.waitingFor || "Waiting for {name}…").replace(
                        "{name}",
                        playerName(room, room.activeCluePlayerId)
                      )}
                </p>
                <ul className={classes.list}>
                  {(room.clueOrder || []).map((id) => (
                    <li
                      key={id}
                      className={`${classes.listItem}${
                        id === room.activeCluePlayerId
                          ? ` ${classes.listItemActive}`
                          : ""
                      }`}
                    >
                      <span>{playerName(room, id)}</span>
                      <span>{room.clues?.[id] || "…"}</span>
                    </li>
                  ))}
                </ul>
                {yourTurn ? (
                  <form className={classes.formRow} onSubmit={submitClue}>
                    <input
                      className={classes.input}
                      value={clue}
                      onChange={(e) => setClue(e.target.value)}
                      maxLength={
                        room.settings?.clueMaxChars > 0
                          ? room.settings.clueMaxChars
                          : 120
                      }
                      placeholder={t.cluePlaceholder || "One short clue"}
                      autoComplete="off"
                    />
                    <button type="submit" className={classes.button}>
                      {t.submitClue || "Submit clue"}
                    </button>
                  </form>
                ) : null}
              </section>
            ) : null}

            {room.subPhase === "discuss" ? (
              <section className={classes.panel}>
                <p className={classes.turnStrip}>
                  {t.discussHint || "Talk it out, then vote."}
                </p>
                <ul className={classes.list}>
                  {Object.entries(room.clues || {}).map(([id, text]) => (
                    <li key={id} className={classes.listItem}>
                      <span>{playerName(room, id)}</span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
                {room.discussionMode === "ready" && room.youAlive ? (
                  <div className={classes.formRow}>
                    <button
                      type="button"
                      className={classes.button}
                      disabled={room.youDiscussReady}
                      onClick={() => onAction?.({ type: "discuss_ready" })}
                    >
                      {t.readyToVote || "Ready to vote"}
                    </button>
                    <span className={classes.meta}>
                      {(t.readyCount || "Ready {ready}/{need}")
                        .replace(
                          "{ready}",
                          String(room.discussReadyCount || 0)
                        )
                        .replace(
                          "{need}",
                          String(room.discussReadyTotal || 0)
                        )}
                    </span>
                  </div>
                ) : null}
              </section>
            ) : null}

            {room.subPhase === "accuse" ? (
              <section className={classes.panel}>
                <p className={classes.turnStrip}>
                  {t.accuseHint ||
                    "Nominate someone. Another player must second."}
                </p>
                {!room.accuseNomineeId && room.youAlive ? (
                  <>
                    <div className={classes.voteGrid}>
                      {(room.alivePlayerIds || [])
                        .filter((id) => id !== room.yourPlayerId)
                        .map((id) => (
                          <button
                            key={id}
                            type="button"
                            className={`${classes.voteCard}${
                              accuseTarget === id
                                ? ` ${classes.voteCardSelected}`
                                : ""
                            }`}
                            onClick={() => setAccuseTarget(id)}
                          >
                            {playerName(room, id)}
                          </button>
                        ))}
                    </div>
                    <button
                      type="button"
                      className={classes.button}
                      disabled={!accuseTarget}
                      onClick={() =>
                        onAction?.({
                          type: "accuse_nominate",
                          targetPlayerId: accuseTarget,
                        })
                      }
                    >
                      {t.nominate || "Nominate"}
                    </button>
                  </>
                ) : (
                  <>
                    <p className={classes.turnStrip}>
                      {(t.nominated || "Nominated: {name}").replace(
                        "{name}",
                        playerName(room, room.accuseNomineeId)
                      )}
                    </p>
                    {room.youAlive &&
                    room.yourPlayerId !== room.accuseNominatorId &&
                    room.yourPlayerId !== room.accuseNomineeId &&
                    !room.accuseSeconderId ? (
                      <button
                        type="button"
                        className={classes.button}
                        onClick={() => onAction?.({ type: "accuse_second" })}
                      >
                        {t.secondAccuse || "Second"}
                      </button>
                    ) : (
                      <p className={classes.outHint}>
                        {t.waitingSecond || "Waiting for a second…"}
                      </p>
                    )}
                  </>
                )}
              </section>
            ) : null}

            {room.subPhase === "vote" ? (
              <section className={classes.panel}>
                <p className={classes.turnStrip}>
                  {room.voteRevoteCount > 0
                    ? t.tieRevote || "Tie — voting again…"
                    : t.voteHint || "Vote for who seems off."}
                </p>
                <div className={classes.voteGrid}>
                  {(room.alivePlayerIds || [])
                    .filter((id) => id !== room.yourPlayerId)
                    .map((id) => (
                      <button
                        key={id}
                        type="button"
                        className={`${classes.voteCard}${
                          voteTarget === id ? ` ${classes.voteCardSelected}` : ""
                        }${
                          id === room.accuseNomineeId
                            ? ` ${classes.voteCardNominee}`
                            : ""
                        }`}
                        disabled={!canVote}
                        onClick={() => setVoteTarget(id)}
                      >
                        {playerName(room, id)}
                      </button>
                    ))}
                </div>
                {canVote ? (
                  <form className={classes.formRow} onSubmit={submitVote}>
                    <button
                      type="submit"
                      className={classes.button}
                      disabled={!voteTarget}
                    >
                      {t.submitVote || "Lock vote"}
                    </button>
                  </form>
                ) : (
                  <p className={classes.outHint}>
                    {t.voteWaiting || "Waiting for everyone to vote…"}
                  </p>
                )}
                <ul className={classes.list}>
                  {(room.alivePlayerIds || []).map((id) => (
                    <li key={id} className={classes.listItem}>
                      <span>{playerName(room, id)}</span>
                      <span>
                        {room.votes?.[id]
                          ? (t.votedFor || "→ {name}").replace(
                              "{name}",
                              playerName(room, room.votes[id])
                            )
                          : "…"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {room.subPhase === "mrwhite_guess" ? (
              <section className={classes.panel}>
                <p className={classes.turnStrip}>
                  {(
                    t.mrWhiteEliminated ||
                    "{name} was eliminated and may guess the civilian word."
                  ).replace(
                    "{name}",
                    room.roundResult?.eliminatedPlayerName || "Mr White"
                  )}
                </p>
                {isMrWhiteGuessing ? (
                  <form className={classes.formRow} onSubmit={submitGuess}>
                    <input
                      className={classes.input}
                      value={mrWhiteGuess}
                      onChange={(e) => setMrWhiteGuess(e.target.value)}
                      maxLength={80}
                      placeholder={t.guessPlaceholder || "Civilian word"}
                      autoComplete="off"
                    />
                    <button type="submit" className={classes.button}>
                      {t.submitGuess || "Guess"}
                    </button>
                  </form>
                ) : (
                  <p className={classes.outHint}>
                    {t.waitingMrWhite || "Waiting for Mr White’s guess…"}
                  </p>
                )}
              </section>
            ) : null}

            {room.subPhase === "round_results" && room.roundResult ? (
              <section className={classes.panel}>
                <p className={classes.phaseTitle}>
                  {winnerLabel(t, room.roundResult.winner)}
                </p>
                <p className={classes.turnStrip}>
                  {(t.eliminatedLine || "Eliminated: {name}").replace(
                    "{name}",
                    room.roundResult.eliminatedPlayerName || "—"
                  )}
                </p>
                {room.roundResult.mrWhiteGuess != null ? (
                  <p className={classes.turnStrip}>
                    {(t.mrWhiteGuessLine || "Guess: {guess} ({ok})")
                      .replace("{guess}", room.roundResult.mrWhiteGuess || "—")
                      .replace(
                        "{ok}",
                        room.roundResult.mrWhiteGuessCorrect
                          ? t.correct || "correct"
                          : t.wrong || "wrong"
                      )}
                  </p>
                ) : null}
                <p className={classes.turnStrip}>
                  {(t.wordsReveal || "Words: {common} / {undercover}")
                    .replace("{common}", room.roundResult.commonWord || "—")
                    .replace(
                      "{undercover}",
                      room.roundResult.undercoverWord || "—"
                    )}
                </p>
                {room.roundResult.foolPlayers?.length ? (
                  <p className={classes.turnStrip}>
                    {(t.foolReveal || "Fool: {names}").replace(
                      "{names}",
                      room.roundResult.foolPlayers.map((p) => p.name).join(", ")
                    )}
                  </p>
                ) : null}
                {room.roundResult.detectivePlayers?.length ? (
                  <p className={classes.turnStrip}>
                    {(t.detectiveReveal || "Detective: {names}").replace(
                      "{names}",
                      room.roundResult.detectivePlayers
                        .map((p) => p.name)
                        .join(", ")
                    )}
                  </p>
                ) : null}
                {achievementIds(room.roundResult.achievements).length ? (
                  <p className={classes.turnStrip}>
                    {t.achievements || "Achievements"}:{" "}
                    {achievementIds(room.roundResult.achievements)
                      .map((id) => achievementLabel(t, id))
                      .join(" · ")}
                  </p>
                ) : null}
                <p className={classes.scores}>
                  <span>
                    {t.scoreCivilians || "Civilians"}:{" "}
                    <strong>{room.scores?.civilians || 0}</strong>
                  </span>
                  <span>
                    {t.scoreUndercover || "Undercover"}:{" "}
                    <strong>{room.scores?.undercover || 0}</strong>
                  </span>
                  <span>
                    {t.scoreMrWhite || "Mr White"}:{" "}
                    <strong>{room.scores?.mr_white || 0}</strong>
                  </span>
                </p>
                {!room.youRatedPair && !room.yourPairRating ? (
                  <div className={classes.formRow}>
                    <span className={classes.meta}>
                      {t.ratePair || "Rate this word pair"}
                    </span>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={classes.presetChip}
                        onClick={() =>
                          onAction?.({ type: "pair_rate", rating: n })
                        }
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                ) : null}
                {isHost ? (
                  <div className={classes.formRow}>
                    <button
                      type="button"
                      className={classes.button}
                      onClick={handleNextRound}
                    >
                      {room.roundResult.isGameOver
                        ? t.seeFinal || "See final results"
                        : t.nextRound || "Next round"}
                    </button>
                    <button
                      type="button"
                      className={`${classes.button} ${classes.buttonGhost}`}
                      onClick={onReset}
                    >
                      {all.settings?.backToLobby ||
                        all.results?.backToLobby ||
                        "Back to lobby"}
                    </button>
                  </div>
                ) : (
                  <p className={classes.outHint}>
                    {t.waitingHost || "Waiting for the host…"}
                  </p>
                )}
              </section>
            ) : null}
          </div>
        </div>
      ) : null}

      {isFinal ? (
        <>
          {achievementIds(
            room?.achievements ||
              room?.achievementsUnlocked ||
              room?.result?.achievements
          ).length ? (
            <p className={classes.finalAchievements}>
              {t.achievements || "Achievements"}:{" "}
              {achievementIds(
                room?.achievements ||
                  room?.achievementsUnlocked ||
                  room?.result?.achievements
              )
                .map((id) => achievementLabel(t, id))
                .join(" · ")}
            </p>
          ) : null}
          <QuizResults
            room={room}
            isHost={isHost}
            onReset={onReset}
            onRematch={rematchWithPageLang}
            lang={lang}
          />
        </>
      ) : null}
    </>
  );
}
