import { getModeView } from "@/lib/quiz/modes";

export default function ModeView({
  room,
  isHost,
  onStart,
  onReset,
  onSubmit,
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
      onSubmit={onSubmit}
      onAction={onAction}
      onUpdateConfig={onUpdateConfig}
      onPickTeam={onPickTeam}
      lang={lang}
    />
  );
}
