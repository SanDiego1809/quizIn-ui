import ClassicModeView from "@/components/quiz/modes/classic/ClassicModeView";

const MODE_VIEWS = {
  classic: ClassicModeView,
};

export function getModeView(modeId) {
  return MODE_VIEWS[modeId] ?? MODE_VIEWS.classic;
}
