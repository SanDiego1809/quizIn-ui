"use client";

import { createContext, useContext, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";

const defaultSession = {
  enabled: false,
  isLoaded: true,
  isSignedIn: false,
  getToken: async () => null,
};

const ClerkSessionContext = createContext(defaultSession);

function ClerkSessionInner({ children }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const value = useMemo(
    () => ({
      enabled: true,
      isLoaded,
      isSignedIn: Boolean(isSignedIn),
      getToken,
    }),
    [isLoaded, isSignedIn, getToken]
  );

  return (
    <ClerkSessionContext.Provider value={value}>
      {children}
    </ClerkSessionContext.Provider>
  );
}

export function ClerkSessionProvider({ children }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <ClerkSessionContext.Provider value={defaultSession}>
        {children}
      </ClerkSessionContext.Provider>
    );
  }

  return <ClerkSessionInner>{children}</ClerkSessionInner>;
}

export function useClerkSession() {
  return useContext(ClerkSessionContext);
}
