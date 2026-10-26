"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QuizLobby from "@/components/quiz/QuizLobby";
import QuizWaitingRoom from "@/components/quiz/QuizWaitingRoom";
import QuizResults from "@/components/quiz/QuizResults";
import NightCityBackground from "./NightCityBackground";
import QuestionFeedbackBar from "@/components/quiz/QuestionFeedbackBar";
import PlayerTable from "./PlayerTable";
import EliminateZone, { pointInRect } from "./EliminateZone";
import RoleIcon from "./RoleIcon";
import DetectiveBoard from "./DetectiveBoard";
import { remainingRoleCounts } from "./roleCounts";
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
  onQuestionFeedback,
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
  const playT = all.play || {};

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
  const [achievementToast, setAchievementToast] = useState(null);
  const [zoneHot, setZoneHot] = useState(false);
  const seenAchievementsRef = useRef(new Set());
  const eliminateZoneRef = useRef(null);

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
    setZoneHot(false);
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

  useEffect(() => {
    if (!isPlaying) {
      seenAchievementsRef.current = new Set();
      setAchievementToast(null);
      return undefined;
    }
    const ids = achievementIds(
      room?.roundResult?.achievements ||
        room?.achievements ||
        room?.achievementsUnlocked
    );
    const fresh = ids.filter((id) => !seenAchievementsRef.current.has(id));
    if (!fresh.length) return undefined;
    fresh.forEach((id) => seenAchievementsRef.current.add(id));
    const label = fresh.map((id) => achievementLabel(t, id)).join(" · ");
    setAchievementToast(label);
    const timer = setTimeout(() => setAchievementToast(null), 4200);
    return () => clearTimeout(timer);
  }, [
    isPlaying,
    room?.roundResult?.achievements,
    room?.achievements,
    room?.achievementsUnlocked,
    t,
  ]);

  const clueOrderNames = useMemo(() => {
    if (!room?.clueOrder?.length) return "";
    return room.clueOrder.map((id) => playerName(room, id)).join(" → ");
  }, [room]);

  const yourTurn =
    isPlaying &&
    room?.subPhase === "clue" &&
    room?.activeCluePlayerId === room?.yourPlayerId;

  const isSpectating =
    isPlaying &&
    room?.youAlive === false &&
    room?.subPhase !== "round_results";

  const boardRevealedRoles = useMemo(() => {
    const base = { ...(room?.revealedRolesByPlayerId || {}) };
    if (room?.subPhase !== "round_results" || !room?.roundResult) return base;
    const result = room.roundResult;
    const special = new Map();
    (result.undercoverPlayers || []).forEach((p) =>
      special.set(p.id, "undercover")
    );
    (result.mrWhitePlayers || []).forEach((p) =>
      special.set(p.id, "mr_white")
    );
    (result.foolPlayers || []).forEach((p) => special.set(p.id, "fool"));
    (result.detectivePlayers || []).forEach((p) =>
      special.set(p.id, "detective")
    );
    (room.players || []).forEach((p) => {
      base[p.id] = special.get(p.id) || base[p.id] || "civilian";
    });
    return base;
  }, [
    room?.revealedRolesByPlayerId,
    room?.subPhase,
    room?.roundResult,
    room?.players,
  ]);

  const canVote =
    isPlaying &&
    room?.subPhase === "vote" &&
    room?.youAlive &&
    !room?.votes?.[room?.yourPlayerId];

  const canNominate =
    isPlaying &&
    room?.subPhase === "accuse" &&
    !room?.accuseNomineeId &&
    room?.youAlive &&
    !isSpectating;

  const interactiveIds = useMemo(() => {
    const ids = new Set();
    if (!room?.alivePlayerIds?.length || !room?.yourPlayerId) return ids;
    const others = room.alivePlayerIds.filter(
      (id) => id !== room.yourPlayerId
    );
    if (canVote) others.forEach((id) => ids.add(id));
    if (canNominate) others.forEach((id) => ids.add(id));
    return ids;
  }, [
    room?.alivePlayerIds,
    room?.yourPlayerId,
    canVote,
    canNominate,
  ]);

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

  const aliveSet = new Set(room?.alivePlayerIds || []);

  const tableSelectedId = canVote
    ? voteTarget
    : canNominate
      ? accuseTarget
      : "";

  const showClueForm =
    room?.subPhase === "clue" && yourTurn && !isSpectating;
  const showDiscussActions = room?.subPhase === "discuss";
  const showBoardActions =
    Boolean(room?.canDetectivePeek && !isSpectating) ||
    showClueForm ||
    showDiscussActions ||
    room?.subPhase === "accuse" ||
    room?.subPhase === "vote" ||
    room?.subPhase === "mrwhite_guess";

  const roleCountsLeft = useMemo(() => remainingRoleCounts(room), [room]);

  const clueEntries = useMemo(() => {
    const clues = room?.clues || {};
    const order = room?.clueOrder?.length
      ? room.clueOrder
      : Object.keys(clues);
    return order
      .filter((id) => clues[id])
      .map((id) => ({
        id,
        name: playerName(room, id),
        clue: clues[id],
      }));
  }, [room]);

  function submitClue(event) {
    event.preventDefault();
    if (!clue.trim()) return;
    onAction?.({ type: "clue_submit", clue: clue.trim() });
  }

  function submitGuess(event) {
    event.preventDefault();
    if (!mrWhiteGuess.trim()) return;
    onAction?.({ type: "mrwhite_guess_submit", guess: mrWhiteGuess.trim() });
  }

  function commitVote(targetId) {
    if (!targetId || !canVote) return;
    onAction?.({ type: "vote_submit", targetPlayerId: targetId });
    setVoteTarget("");
  }

  function commitNominate(targetId) {
    if (!targetId) return;
    onAction?.({ type: "accuse_nominate", targetPlayerId: targetId });
    setAccuseTarget("");
  }

  function handleNextRound() {
    if (room?.roundResult?.isGameOver) {
      onAction?.({ type: "finish_match" });
      return;
    }
    onAction?.({ type: "round_next" });
  }

  function handleCardSelect(playerId) {
    if (canVote) {
      setVoteTarget((prev) => (prev === playerId ? "" : playerId));
      return;
    }
    if (canNominate) {
      setAccuseTarget((prev) => (prev === playerId ? "" : playerId));
    }
  }

  function handleCardDragMove({ clientX, clientY }) {
    setZoneHot(pointInRect(clientX, clientY, eliminateZoneRef.current));
  }

  function handleCardDragEnd({ playerId, clientX, clientY, moved }) {
    const overZone = pointInRect(clientX, clientY, eliminateZoneRef.current);
    setZoneHot(false);
    if (!moved) return;
    if (!overZone) return;
    if (canVote) {
      commitVote(playerId);
      return;
    }
    if (canNominate) {
      commitNominate(playerId);
    }
  }

  function handleZoneConfirm() {
    if (canVote && voteTarget) {
      commitVote(voteTarget);
      return;
    }
    if (canNominate && accuseTarget) {
      commitNominate(accuseTarget);
    }
  }

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
              </>
            )}
          </div>
        </div>
      ) : null}

      {isPlaying ? (
        <div className={classes.shell}>
          <NightCityBackground intensity="play" />
          <div className={classes.playOverlay}>
          <div className={classes.playRoot}>
            {achievementToast ? (
              <div className={classes.achievementToast} role="status">
                <span className={classes.achievementToastLabel}>
                  {t.achievements || "Achievements"}
                </span>
                <span>{achievementToast}</span>
              </div>
            ) : null}

            <DetectiveBoard
              result={
                room.subPhase === "round_results" ? room.roundResult : null
              }
              roleCounts={roleCountsLeft}
              clueEntries={clueEntries}
              phaseTitleText={phaseTitle(t, room.subPhase)}
              roundMetaText={`${(t.roundMeta || "Round {current} / {total}")
                .replace("{current}", String(room.currentRound || 0))
                .replace("{total}", String(room.totalRounds || 0))}${
                countdown ? ` · ${countdown}` : ""
              }`}
              winnerText={winnerLabel(t, room.roundResult?.winner)}
              eliminatedLabel={t.eliminatedShort || "Out"}
              wordCivilianLabel={t.wordCivilian || "Civilian word"}
              wordUndercoverLabel={t.wordUndercover || "Undercover word"}
              guessLabel={t.guessShort || "Guess"}
              correctLabel={t.correct || "correct"}
              wrongLabel={t.wrong || "wrong"}
              scoreCivilians={t.scoreCivilians || "Civilians"}
              scoreUndercover={t.scoreUndercover || "Undercover"}
              scoreMrWhite={t.scoreMrWhite || "Mr White"}
              cluesDockLabel={t.cluesDock || "Clues"}
              caseLabel={t.caseBoard || "Case board"}
              nextLabel={
                room.roundResult?.isGameOver
                  ? t.seeFinal || "See final results"
                  : t.nextRound || "Next round"
              }
              lobbyLabel={
                all.settings?.backToLobby ||
                all.results?.backToLobby ||
                "Back to lobby"
              }
              isHost={isHost}
              onNext={handleNextRound}
              onLobby={onReset}
              waitingHostLabel={t.waitingHost || "Waiting for the host…"}
              topSlot={
                <>
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
                    <span className={classes.secretTape} aria-hidden="true" />
                    <div className={classes.secretIcon}>
                      <RoleIcon
                        role={showRole ? room.yourRole : "mystery"}
                        size="lg"
                        title={
                          showRole ? roleLabel(t, room.yourRole) : undefined
                        }
                      />
                    </div>
                    <div className={classes.secretBody}>
                      <div className={classes.secretHeader}>
                        <p className={classes.secretLabel}>
                          {showRole
                            ? t.yourSecret || "Your secret"
                            : t.yourWord || "Your word"}
                        </p>
                        {room.wordPairId && onQuestionFeedback ? (
                          <div className={classes.feedbackCorner}>
                            <QuestionFeedbackBar
                              questionId={room.wordPairId}
                              reportOnly
                              onFeedback={(kind, extra = {}) =>
                                onQuestionFeedback({
                                  questionId: room.wordPairId,
                                  kind,
                                  note: extra.note,
                                })
                              }
                              labels={{
                                report:
                                  t.feedbackReport ||
                                  playT.feedbackReport ||
                                  "Report error",
                                reported:
                                  t.feedbackReported ||
                                  playT.feedbackReported ||
                                  "Thanks — flagged for review.",
                                reportedShort:
                                  t.feedbackReportedShort ||
                                  playT.feedbackReportedShort ||
                                  "Reported",
                                error:
                                  t.feedbackError ||
                                  playT.feedbackError ||
                                  "Could not save.",
                                reportTitle:
                                  t.feedbackReportTitle ||
                                  "Report a wrong, unclear, or broken word pair",
                                noteLabel:
                                  t.feedbackNoteLabel ||
                                  playT.feedbackNoteLabel ||
                                  "Optional note (what’s wrong?)",
                                notePlaceholder:
                                  t.feedbackNotePlaceholder ||
                                  "e.g. Typo, translation wrong, too similar / too hard…",
                                sendReport:
                                  t.feedbackSendReport ||
                                  playT.feedbackSendReport ||
                                  "Send report",
                                cancel:
                                  t.feedbackCancel ||
                                  playT.feedbackCancel ||
                                  "Cancel",
                              }}
                            />
                          </div>
                        ) : null}
                      </div>
                      {showRole ? (
                        <p className={classes.secretRole}>
                          {roleLabel(t, room.yourRole)}
                        </p>
                      ) : null}
                      <p className={classes.secretWord}>
                        {showNoWord
                          ? t.noWord || "No word"
                          : room.yourWord || "—"}
                      </p>
                    </div>
                  </aside>
                  <div className={classes.statusNote} role="status">
                    {isSpectating ? (
                      <p>
                        {t.watching || "Watching"} —{" "}
                        {t.youAreOut ||
                          "You're out for this round — watch the others."}
                      </p>
                    ) : null}
                    {room.isBlankRound ? (
                      <p className={classes.statusNoteStrong}>
                        {t.blankRoundBanner ||
                          "Blank round — no one has a word. Bluff."}
                      </p>
                    ) : null}
                    {yourTurn ? (
                      <p className={classes.statusNoteStrong}>
                        {t.yourTurnBanner ||
                          t.yourTurn ||
                          "Your turn — give a short clue."}
                      </p>
                    ) : room.subPhase === "clue" ? (
                      <p>
                        {(t.waitingFor || "Waiting for {name}…").replace(
                          "{name}",
                          playerName(room, room.activeCluePlayerId)
                        )}
                      </p>
                    ) : (
                      <p>
                        {t.scoreHint ||
                          "Points: correct vote + surviving (updated at round end)."}
                      </p>
                    )}
                    {room.subPhase === "clue" && clueOrderNames ? (
                      <p>
                        {(t.turnOrder || "Order: {order}").replace(
                          "{order}",
                          clueOrderNames
                        )}
                      </p>
                    ) : null}
                    {room.detectivePeekResult ? (
                      <p>
                        {(room.detectivePeekResult.result === "special"
                          ? t.peekResultSpecial
                          : t.peekResultCivilian || "{name}"
                        ).replace(
                          "{name}",
                          playerName(
                            room,
                            room.detectivePeekResult.targetPlayerId
                          )
                        )}
                      </p>
                    ) : null}
                  </div>
                </>
              }
              bottomSlot={
                showBoardActions ? (
                <div className={classes.dossier}>
                  {room.canDetectivePeek && !isSpectating ? (
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
                  ) : null}

                  {room.subPhase === "clue" && yourTurn && !isSpectating ? (
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

                  {room.subPhase === "discuss" ? (
                    <>
                      <p className={classes.turnStrip}>
                        {t.discussHint || "Talk it out, then vote."}
                      </p>
                      {room.discussionMode === "ready" ? (
                        <div className={classes.formRow}>
                          {!isSpectating && room.youAlive ? (
                            <button
                              type="button"
                              className={classes.button}
                              disabled={room.youDiscussReady}
                              onClick={() =>
                                onAction?.({ type: "discuss_ready" })
                              }
                            >
                              {t.readyToVote || "Ready to vote"}
                            </button>
                          ) : null}
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
                    </>
                  ) : null}

                  {room.subPhase === "accuse" ? (
                    <>
                      <p className={classes.turnStrip}>
                        {t.accuseHint ||
                          "Nominate someone. Another player must second."}
                      </p>
                      {canNominate ? (
                        <EliminateZone
                          ref={eliminateZoneRef}
                          mode="nominate"
                          label={t.nominateZone || "Nominate"}
                          hint={
                            t.dragNominateHint ||
                            "Drag a card here, or tap a card then this zone."
                          }
                          selectedName={
                            accuseTarget
                              ? playerName(room, accuseTarget)
                              : null
                          }
                          confirmLabel={t.nominate || "Nominate"}
                          hot={zoneHot}
                          onConfirm={handleZoneConfirm}
                        />
                      ) : room.accuseNomineeId ? (
                        <>
                          <p className={classes.turnStrip}>
                            {(t.nominated || "Nominated: {name}").replace(
                              "{name}",
                              playerName(room, room.accuseNomineeId)
                            )}
                          </p>
                          {!isSpectating &&
                          room.youAlive &&
                          room.yourPlayerId !== room.accuseNominatorId &&
                          room.yourPlayerId !== room.accuseNomineeId &&
                          !room.accuseSeconderId ? (
                            <button
                              type="button"
                              className={classes.button}
                              onClick={() =>
                                onAction?.({ type: "accuse_second" })
                              }
                            >
                              {t.secondAccuse || "Second"}
                            </button>
                          ) : (
                            <p className={classes.outHint}>
                              {t.waitingSecond || "Waiting for a second…"}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className={classes.outHint}>
                          {t.waitingNominate || "Waiting for a nomination…"}
                        </p>
                      )}
                    </>
                  ) : null}

                  {room.subPhase === "vote" ? (
                    <>
                      <p className={classes.turnStrip}>
                        {room.voteRevoteCount > 0
                          ? t.tieRevote || "Tie — voting again…"
                          : t.voteHint || "Vote for who seems off."}
                      </p>
                      {canVote ? (
                        <EliminateZone
                          ref={eliminateZoneRef}
                          mode="eliminate"
                          label={t.eliminateZone || "Eliminate"}
                          hint={
                            t.dragEliminateHint ||
                            "Drag a card here, or tap a card then this zone."
                          }
                          selectedName={
                            voteTarget
                              ? playerName(room, voteTarget)
                              : null
                          }
                          confirmLabel={t.submitVote || "Lock vote"}
                          hot={zoneHot}
                          onConfirm={handleZoneConfirm}
                        />
                      ) : (
                        <p className={classes.outHint}>
                          {t.voteWaiting ||
                            "Waiting for everyone to vote…"}
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
                      {isHost ? (
                        <div className={classes.formRow}>
                          <button
                            type="button"
                            className={`${classes.button} ${classes.buttonGhost}`}
                            title={
                              t.skipEliminationHint ||
                              "Cancel this vote and play another clue round with the same words."
                            }
                            onClick={() =>
                              onAction?.({ type: "skip_elimination" })
                            }
                          >
                            {t.skipElimination || "Another clue round"}
                          </button>
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {room.subPhase === "mrwhite_guess" ? (
                    <>
                      <p className={classes.turnStrip}>
                        {(
                          t.mrWhiteEliminated ||
                          "{name} was eliminated and may guess the civilian word."
                        ).replace(
                          "{name}",
                          room.roundResult?.eliminatedPlayerName ||
                            "Mr White"
                        )}
                      </p>
                      {isMrWhiteGuessing ? (
                        <form
                          className={classes.formRow}
                          onSubmit={submitGuess}
                        >
                          <input
                            className={classes.input}
                            value={mrWhiteGuess}
                            onChange={(e) =>
                              setMrWhiteGuess(e.target.value)
                            }
                            maxLength={80}
                            placeholder={
                              t.guessPlaceholder || "Civilian word"
                            }
                            autoComplete="off"
                          />
                          <button
                            type="submit"
                            className={classes.button}
                          >
                            {t.submitGuess || "Guess"}
                          </button>
                        </form>
                      ) : (
                        <p className={classes.outHint}>
                          {t.waitingMrWhite ||
                            "Waiting for Mr White’s guess…"}
                        </p>
                      )}
                    </>
                  ) : null}

                </div>
                ) : null
              }
            >
              <PlayerTable
                players={room.players || []}
                aliveSet={aliveSet}
                revealedRolesByPlayerId={boardRevealedRoles}
                yourPlayerId={room.yourPlayerId}
                activeCluePlayerId={room.activeCluePlayerId}
                accuseNomineeId={room.accuseNomineeId}
                playerScores={room.playerScores || {}}
                clues={room.clues || {}}
                subPhase={room.subPhase}
                selectedId={tableSelectedId}
                interactiveIds={interactiveIds}
                roleLabelFn={(role) => roleLabel(t, role)}
                onSelect={handleCardSelect}
                onDragMove={handleCardDragMove}
                onDragEnd={handleCardDragEnd}
              />
            </DetectiveBoard>
          </div>
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
