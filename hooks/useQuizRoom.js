"use client";

import { useCallback, useEffect, useState } from "react";
import { useClerkSession } from "@/components/auth/ClerkSessionProvider";
import { getQuizSocket, syncQuizSocketAuth } from "@/lib/quiz/socket";

export function useQuizRoom() {
  const { enabled, isLoaded, isSignedIn, getToken } = useClerkSession();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      if (enabled && !isLoaded) return;

      const socket = enabled
        ? await syncQuizSocketAuth(isSignedIn ? getToken : null)
        : getQuizSocket();
      if (!socket || cancelled) return undefined;

      const onConnect = () => {
        setConnected(true);
        setConnectionError(null);
      };
      const onDisconnect = () => setConnected(false);
      const onConnectError = (err) => {
        setConnected(false);
        const raw = err?.message || "";
        const friendly =
          raw.includes("xhr poll error") || raw.includes("websocket error")
            ? "Cannot reach the game server. In a second terminal run: npm run dev:socket"
            : raw ||
              "Cannot reach the game server. Run npm run dev:socket in a second terminal.";
        setConnectionError(friendly);
      };
      const onRoomState = (state) => {
        setRoom(state);
        setError(null);
      };
      const onQuizError = ({ message }) => setError(message);

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("connect_error", onConnectError);
      socket.on("quiz:room_state", onRoomState);
      socket.on("quiz:error", onQuizError);

      if (!socket.connected && !socket.active) socket.connect();
      if (socket.connected) {
        setConnected(true);
        setConnectionError(null);
      }

      return () => {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("connect_error", onConnectError);
        socket.off("quiz:room_state", onRoomState);
        socket.off("quiz:error", onQuizError);
      };
    }

    let cleanup;
    connect().then((fn) => {
      cleanup = fn;
    });

    return () => {
      cancelled = true;
      if (typeof cleanup === "function") cleanup();
    };
  }, [enabled, isLoaded, isSignedIn, getToken]);

  const createRoom = useCallback((name, mode) => {
    const payload = { name };
    if (mode) payload.mode = mode;
    getQuizSocket()?.emit("quiz:room_create", payload);
  }, []);

  const joinRoom = useCallback((roomCode, name) => {
    getQuizSocket()?.emit("quiz:room_join", { roomCode, name });
  }, []);

  const updateRoomConfig = useCallback(
    ({ mode, settings }) => {
      if (!room?.roomCode) return;
      getQuizSocket()?.emit("quiz:room_config", {
        roomCode: room.roomCode,
        mode,
        settings,
      });
    },
    [room?.roomCode]
  );

  const pickTeam = useCallback(
    (team) => {
      if (!room?.roomCode) return;
      getQuizSocket()?.emit("quiz:player_team", {
        roomCode: room.roomCode,
        team,
      });
    },
    [room?.roomCode]
  );

  const startGame = useCallback(
    (extraSettings) => {
      if (!room?.roomCode) return;
      const settings =
        extraSettings && typeof extraSettings === "object"
          ? { ...(room.settings || {}), ...extraSettings }
          : undefined;
      getQuizSocket()?.emit("quiz:game_start", {
        roomCode: room.roomCode,
        ...(settings ? { settings } : {}),
      });
    },
    [room?.roomCode, room?.settings]
  );

  const sendGameAction = useCallback(
    (action) => {
      if (!room?.roomCode) return;
      getQuizSocket()?.emit("quiz:game_action", {
        roomCode: room.roomCode,
        action,
      });
    },
    [room?.roomCode]
  );

  const submitAnswer = useCallback(
    (optionIndex) => {
      sendGameAction({ type: "submit_answer", optionIndex });
    },
    [sendGameAction]
  );

  const advanceRound = useCallback(() => {
    sendGameAction({ type: "advance_round" });
  }, [sendGameAction]);

  const resetGame = useCallback(() => {
    if (!room?.roomCode) return;
    getQuizSocket()?.emit("quiz:game_reset", { roomCode: room.roomCode });
  }, [room?.roomCode]);

  const rematchGame = useCallback(
    (extraSettings) => {
      if (!room?.roomCode) return;
      const settings =
        extraSettings && typeof extraSettings === "object"
          ? { ...(room.settings || {}), ...extraSettings }
          : undefined;
      getQuizSocket()?.emit("quiz:game_rematch", {
        roomCode: room.roomCode,
        ...(settings ? { settings } : {}),
      });
    },
    [room?.roomCode, room?.settings]
  );

  const sendQuestionFeedback = useCallback(
    ({ questionId, kind, note }) =>
      new Promise((resolve) => {
        const socket = getQuizSocket();
        if (!socket || !room?.roomCode) {
          resolve({ ok: false, message: "Not connected." });
          return;
        }

        const onResult = (result) => {
          socket.off("quiz:question_feedback_result", onResult);
          resolve(result || { ok: false, message: "No response." });
        };

        const timer = setTimeout(() => {
          socket.off("quiz:question_feedback_result", onResult);
          resolve({ ok: false, message: "Feedback timed out." });
        }, 8000);

        socket.on("quiz:question_feedback_result", (result) => {
          clearTimeout(timer);
          onResult(result);
        });

        socket.emit("quiz:question_feedback", {
          roomCode: room.roomCode,
          questionId,
          kind,
          note,
        });
      }),
    [room?.roomCode]
  );

  const isHost = room?.yourPlayerId === room?.hostId;

  return {
    room,
    error,
    connected,
    connectionError,
    isHost,
    createRoom,
    joinRoom,
    startGame,
    updateRoomConfig,
    pickTeam,
    submitAnswer,
    advanceRound,
    sendGameAction,
    sendQuestionFeedback,
    resetGame,
    rematchGame,
    clearError: () => setError(null),
  };
}
