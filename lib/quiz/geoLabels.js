import geoCapitals from "@/lib/quiz/data/geoCapitals.json";
import geoCountries from "@/lib/quiz/data/geoCountries.json";

function normalizeLang(lang) {
  const value = String(lang || "en")
    .trim()
    .toLowerCase();
  if (value.startsWith("fr")) return "fr";
  if (value.startsWith("es")) return "es";
  return "en";
}

function normalizeCode(countryCode) {
  return String(countryCode || "")
    .trim()
    .toLowerCase();
}

export function getCountryLabel(countryCode, lang = "en", fallback = "") {
  const code = normalizeCode(countryCode);
  const locale = normalizeLang(lang);
  return (
    geoCountries[locale]?.[code] ||
    geoCountries.en?.[code] ||
    fallback ||
    code.toUpperCase()
  );
}

export function getCapitalLabel(countryCode, lang = "en", fallback = "") {
  const code = normalizeCode(countryCode);
  const locale = normalizeLang(lang);
  return (
    geoCapitals[locale]?.[code] ||
    geoCapitals.en?.[code] ||
    fallback ||
    ""
  );
}
