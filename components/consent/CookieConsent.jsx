"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "quizin_analytics_consent";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function loadGtag(id) {
  if (!id) return;
  if (typeof window === "undefined") return;
  if (window.__quizin_gtag_loaded) return;

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  script.async = true;
  document.head.appendChild(script);

  const inline = document.createElement("script");
  inline.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${id}', { anonymize_ip: true });
  `;
  document.head.appendChild(inline);
  window.__quizin_gtag_loaded = true;
}

export default function CookieConsent() {
  const [consent, setConsent] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (consent === "granted") {
      loadGtag(GA_ID);
    }
  }, [consent]);

  if (consent) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 12,
        background: "rgba(2,6,23,0.92)",
        color: "#e2e8f0",
        padding: "1rem 1rem",
        borderRadius: 12,
        boxShadow: "0 8px 30px rgba(2,6,23,0.6)",
        display: "flex",
        gap: 12,
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div style={{ flex: 1 }}>
        <strong>We use cookies for analytics</strong>
        <div style={{ color: "#94a3b8", marginTop: 6, fontSize: 14 }}>
          We use Google Analytics to measure site usage. Accept to enable analytics, or decline to opt out.
          <a href="/privacy" style={{ color: "#38bdf8", marginLeft: 8 }}>
            Privacy
          </a>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => {
            try {
              localStorage.setItem(STORAGE_KEY, "denied");
            } catch {}
            setConsent("denied");
          }}
          style={{
            background: "transparent",
            color: "#94a3b8",
            border: "1px solid #334155",
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Decline
        </button>
        <button
          onClick={() => {
            try {
              localStorage.setItem(STORAGE_KEY, "granted");
            } catch {}
            setConsent("granted");
          }}
          style={{
            background:
              "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
            color: "#0f172a",
            border: "none",
            padding: "0.5rem 0.9rem",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}

