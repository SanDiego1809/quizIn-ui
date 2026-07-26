import ClassicModeView from "@/components/quiz/modes/classic/ClassicModeView";
import GeographyModeView from "@/components/quiz/modes/geography/GeographyModeView";

const MODE_VIEWS = {
  classic: ClassicModeView,
  geography: GeographyModeView,
};

export function getModeView(modeId) {
  return MODE_VIEWS[modeId] ?? MODE_VIEWS.classic;
}
