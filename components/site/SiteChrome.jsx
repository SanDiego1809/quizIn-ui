"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { FlashBannerProvider } from "@/components/ui/FlashBanner";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import classes from "./SiteChrome.module.css";

const SiteChromeContext = createContext({
  immersive: false,
  setImmersive: () => {},
});

export function useSiteChrome() {
  return useContext(SiteChromeContext);
}

export default function SiteChrome({ children }) {
  const [immersive, setImmersive] = useState(false);
  const value = useMemo(() => ({ immersive, setImmersive }), [immersive]);

  return (
    <FlashBannerProvider>
      <SiteChromeContext.Provider value={value}>
        <div className={classes.shell}>
          {!immersive ? <SiteHeader /> : null}
          <div className={classes.content}>{children}</div>
          {!immersive ? (
            <div className={classes.footer}>
              <SiteFooter />
            </div>
          ) : null}
        </div>
      </SiteChromeContext.Provider>
    </FlashBannerProvider>
  );
}
