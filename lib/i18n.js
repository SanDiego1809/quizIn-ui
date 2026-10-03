import en from "./locales/en.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";

const MAP = { en, fr, es };

export function getTranslations(lang = "en") {
  return MAP[lang] ?? MAP.en;
}


