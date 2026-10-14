"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { DEFAULT_ANIMATION, DEFAULT_VICTORY_ANIMATION } from "@/lib/quiz/animations";
import { DEFAULT_SKIN } from "@/lib/quiz/cosmetics";
import classes from "./HomePage.module.css";

const AvatarScene = dynamic(() => import("@/components/avatar/AvatarScene"), {
  ssr: false,
  loading: () => <div className={classes.avatarPeekPlaceholder} />,
});

export default function HomeAvatarPeek() {
  const { defaultAnimation, defaultSkin, isSignedIn } = usePlayerProfile();
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div className={classes.avatarPeek}>
      <AvatarScene
        animation={
          isSignedIn
            ? defaultAnimation || DEFAULT_VICTORY_ANIMATION
            : DEFAULT_ANIMATION
        }
        skinKey={isSignedIn ? defaultSkin || DEFAULT_SKIN : DEFAULT_SKIN}
        className={classes.avatarPeekScene}
        showQuizPedestal={false}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
