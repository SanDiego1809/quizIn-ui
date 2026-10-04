"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  detectNavigatorLang,
  normalizeLang,
  readStoredLang,
  writeStoredLang,
} from "@/lib/lang";

const LangContext = createContext({
  lang: "en",
  setLang: () => {},
});

export function useLang() {
  return useContext(LangContext);
}

export default function LangProvider({ children, initialLang } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [lang, setLangState] = useState(() => normalizeLang(initialLang) || "en");

  useEffect(() => {
    const fromQuery =
      typeof window !== "undefined"
        ? normalizeLang(new URL(window.location.href).searchParams.get("lang"))
        : null;
    const next = fromQuery || readStoredLang() || detectNavigatorLang() || "en";
    setLangState(next);
    writeStoredLang(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
  }, [pathname]);

  function setLang(nextLang) {
    const next = normalizeLang(nextLang) || "en";
    setLangState(next);
    writeStoredLang(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
  );
}
