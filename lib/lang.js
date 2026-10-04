export const LANG_STORAGE_KEY = "quizin_lang";
export const SUPPORTED_LANGS = ["en", "fr", "es"];

export function normalizeLang(value) {
  if (!value || typeof value !== "string") return null;
  const code = value.slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(code) ? code : null;
}

export function readStoredLang() {
  try {
    return normalizeLang(localStorage.getItem(LANG_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredLang(lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

export function detectNavigatorLang() {
  try {
    return normalizeLang(navigator?.language);
  } catch {
    return null;
  }
}
