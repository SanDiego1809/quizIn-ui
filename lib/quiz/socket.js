import { io } from "socket.io-client";

let socket;
let socketUrl;

const DEV_SOCKET_URL = "http://127.0.0.1:4000";

function resolveSocketUrl() {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (typeof window !== "undefined") {
    // Next.js rewrites often fail to proxy Socket.IO in dev; connect directly instead.
    if (process.env.NODE_ENV === "development") {
      return DEV_SOCKET_URL;
    }
    return window.location.origin;
  }
  return undefined;
}

export function getQuizSocket() {
  if (typeof window === "undefined") return null;
  const url = resolveSocketUrl();
  if (socket && socketUrl !== url) {
    socket.disconnect();
    socket = undefined;
  }
  if (!socket) {
    socketUrl = url;
    socket = io(url, {
      path: "/socket.io",
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}
