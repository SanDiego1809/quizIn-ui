"use client";

import { useCallback, useEffect, useState } from "react";
import { getQuizSocket } from "@/lib/quiz/socket";

export function useQuizRoom() {
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const socket = getQuizSocket();
    if (!socket) return undefined;

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
  }, []);

  const createRoom = useCallback((name, animation, mode) => {
    const payload = { name, animation };
    if (mode) payload.mode = mode;
    getQuizSocket()?.emit("quiz:room_create", payload);
  }, []);

  const joinRoom = useCallback((roomCode, name, animation) => {
    getQuizSocket()?.emit("quiz:room_join", { roomCode, name, animation });
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

  const startGame = useCallback(() => {
    if (!room?.roomCode) return;
    getQuizSocket()?.emit("quiz:game_start", {
      roomCode: room.roomCode,
    });
  }, [room?.roomCode]);

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

  const resetGame = useCallback(() => {
    if (!room?.roomCode) return;
    getQuizSocket()?.emit("quiz:game_reset", { roomCode: room.roomCode });
  }, [room?.roomCode]);

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
    submitAnswer,
    sendGameAction,
    resetGame,
    clearError: () => setError(null),
  };
}
