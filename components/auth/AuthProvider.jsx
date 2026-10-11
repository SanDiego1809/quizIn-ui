"use client";

import { ClerkSessionProvider } from "./ClerkSessionProvider";

/** Session helpers for quiz socket / profile; ClerkProvider lives in app/layout.js */
export default function AuthProvider({ children }) {
  return <ClerkSessionProvider>{children}</ClerkSessionProvider>;
}
