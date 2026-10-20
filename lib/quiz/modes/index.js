import ClassicModeView from "@/components/quiz/modes/classic/ClassicModeView";
import GeographyModeView from "@/components/quiz/modes/geography/GeographyModeView";
import PictureModeView from "@/components/quiz/modes/picture/PictureModeView";
import UndercoverModeView from "@/components/quiz/modes/undercover/UndercoverModeView";

const MODE_VIEWS = {
  classic: ClassicModeView,
  geography: GeographyModeView,
  picture: PictureModeView,
  undercover: UndercoverModeView,
};

export function getModeView(modeId) {
  return MODE_VIEWS[modeId] ?? MODE_VIEWS.classic;
}
