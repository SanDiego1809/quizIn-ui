import { getModeView } from "@/lib/quiz/modes";

export default function ModeView({
  room,
  isHost,
  onStart,
  onReset,
  onRematch,
  onSubmit,
  onAdvance,
  onQuestionFeedback,
  onAction,
  onUpdateConfig,
  onPickTeam,
  lang = "en",
}) {
  const View = getModeView(room.mode);

  return (
    <View
      room={room}
      isHost={isHost}
      onStart={onStart}
      onReset={onReset}
      onRematch={onRematch}
      onSubmit={onSubmit}
      onAdvance={onAdvance}
      onQuestionFeedback={onQuestionFeedback}
      onAction={onAction}
      onUpdateConfig={onUpdateConfig}
      onPickTeam={onPickTeam}
      lang={lang}
    />
  );
}
