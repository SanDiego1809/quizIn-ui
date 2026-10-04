"use client";

import { createContext, useContext, useMemo, useState } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

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
    <SiteChromeContext.Provider value={value}>
      {!immersive ? <SiteHeader /> : null}
      {children}
      {!immersive ? <SiteFooter /> : null}
    </SiteChromeContext.Provider>
  );
}
