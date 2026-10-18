"use client";

import Link from "next/link";
import AuthControls from "@/components/auth/AuthControls";
import { getTranslations } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site/site";
import LanguageDropdown from "./LanguageDropdown";
import { useLang } from "./LangProvider";
import classes from "./SiteHeader.module.css";

export default function SiteHeader({ overlay = false }) {
  const { lang } = useLang();
  const t = getTranslations(lang).site;

  return (
    <header
      className={`${classes.header} ${overlay ? classes.headerOverlay : ""}`.trim()}
    >
      <div className={classes.inner}>
        <Link
          href={`/?lang=${lang}`}
          className={classes.brand}
          aria-label={SITE_NAME}
        >
          {/* Plain img avoids Next/Image sizing quirks with transparent PNGs */}
          <img
            src="/quizin-logo-dark.png"
            alt={SITE_NAME}
            className={classes.brandLogo}
            width={949}
            height={429}
            decoding="async"
          />
        </Link>

        <div className={classes.actions}>
          <LanguageDropdown label={t.languageLabel} />
          <AuthControls />
        </div>
      </div>
    </header>
  );
}
