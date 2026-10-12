"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { DEFAULT_ANIMATION } from "@/lib/quiz/animations";
import classes from "./HomePage.module.css";

const AvatarScene = dynamic(() => import("@/components/avatar/AvatarScene"), {
  ssr: false,
  loading: () => <div className={classes.avatarPeekPlaceholder} />,
});

export default function HomeAvatarPeek() {
  const { defaultAnimation } = usePlayerProfile();
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div className={classes.avatarPeek}>
      <AvatarScene
        animation={defaultAnimation || DEFAULT_ANIMATION}
        className={classes.avatarPeekScene}
        showQuizPedestal={false}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
