"use client";

import { useEffect, useState } from "react";
import { useClerkSession } from "@/components/auth/ClerkSessionProvider";
import { DEFAULT_VICTORY_ANIMATION } from "@/lib/quiz/animations";
import { DEFAULT_SKIN, resolveSkinId } from "@/lib/quiz/cosmetics";

export function usePlayerProfile() {
  const { enabled, isLoaded, isSignedIn } = useClerkSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !isLoaded) return undefined;
    if (!isSignedIn) {
      setProfile(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/me")
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setProfile(data?.profile ?? null);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, isLoaded, isSignedIn]);

  return {
    profile,
    loading,
    isSignedIn: enabled && isSignedIn,
    defaultName: profile?.displayName || "",
    defaultAnimation: profile?.avatarKey || DEFAULT_VICTORY_ANIMATION,
    defaultSkin: resolveSkinId(profile?.skinKey || DEFAULT_SKIN),
    plan: profile?.plan || "free",
    unlockedCosmetics: profile?.unlockedCosmetics || [],
    refreshProfile: () => {
      if (!enabled || !isSignedIn) return;
      fetch("/api/me")
        .then(async (res) => (res.ok ? res.json() : null))
        .then((data) => setProfile(data?.profile ?? null))
        .catch(() => {});
    },
  };
}
