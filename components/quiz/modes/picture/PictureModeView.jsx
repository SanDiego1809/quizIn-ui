"use client";

import ClassicModeView from "@/components/quiz/modes/classic/ClassicModeView";

/** Picture Round reuses the classic TV-show shell; questions carry imageUrl. */
export default function PictureModeView(props) {
  return <ClassicModeView {...props} />;
}
