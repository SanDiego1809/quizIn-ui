"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const STORAGE_KEY = "quizin_analytics_consent";

function sendPageview(url) {
  if (!window.gtag || !GA_ID) return;
  window.gtag("config", GA_ID, { page_path: url });
}

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    const consent = (() => {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    })();

    if (consent !== "granted") return;
    // if GA loaded, send initial page; subsequent route changes trigger this effect
    sendPageview(pathname);
  }, [pathname]);

  return null;
}

