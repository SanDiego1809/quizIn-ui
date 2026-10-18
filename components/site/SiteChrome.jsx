"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { FlashBannerProvider } from "@/components/ui/FlashBanner";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import classes from "./SiteChrome.module.css";

/** @typedef {"default" | "immersive" | "overlay"} ChromeMode */

const SiteChromeContext = createContext({
  immersive: false,
  chromeMode: /** @type {ChromeMode} */ ("default"),
  setImmersive: /** @type {(value: boolean) => void} */ (() => {}),
  setChromeMode: /** @type {(mode: ChromeMode) => void} */ (() => {}),
});

export function useSiteChrome() {
  return useContext(SiteChromeContext);
}

export default function SiteChrome({ children }) {
  const [chromeMode, setChromeMode] = useState(/** @type {ChromeMode} */ ("default"));

  const setImmersive = (value) => {
    setChromeMode(value ? "immersive" : "default");
  };

  const value = useMemo(
    () => ({
      immersive: chromeMode === "immersive",
      chromeMode,
      setImmersive,
      setChromeMode,
    }),
    [chromeMode]
  );

  const showHeader = chromeMode === "default" || chromeMode === "overlay";
  const showFooter = chromeMode === "default";
  const overlay = chromeMode === "overlay";
  const fullBleed = chromeMode === "immersive" || chromeMode === "overlay";

  return (
    <FlashBannerProvider>
      <SiteChromeContext.Provider value={value}>
        <div
          className={`${classes.shell} ${fullBleed ? classes.shellFullBleed : ""}`.trim()}
        >
          {showHeader ? <SiteHeader overlay={overlay} /> : null}
          <div
            className={`${classes.content} ${fullBleed ? classes.contentFullBleed : ""}`.trim()}
          >
            {children}
          </div>
          {showFooter ? (
            <div className={classes.footer}>
              <SiteFooter />
            </div>
          ) : null}
        </div>
      </SiteChromeContext.Provider>
    </FlashBannerProvider>
  );
}
