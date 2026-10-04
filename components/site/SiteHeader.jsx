"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getTranslations } from "@/lib/i18n";
import { SUPPORTED_LANGS } from "@/lib/lang";
import { SITE_NAME } from "@/lib/site/site";
import { useLang } from "./LangProvider";
import classes from "./SiteHeader.module.css";

export default function SiteHeader() {
  const pathname = usePathname();
  const { lang, setLang } = useLang();
  const t = getTranslations(lang).site;
  const onPlay = pathname === "/play" || pathname.startsWith("/play/");

  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Link href={`/?lang=${lang}`} className={classes.brand}>
          {SITE_NAME}
        </Link>

        <div className={classes.actions}>
          <div className={classes.langs} role="group" aria-label={t.languageLabel}>
            {SUPPORTED_LANGS.map((code) => (
              <button
                key={code}
                type="button"
                className={code === lang ? classes.langActive : classes.lang}
                onClick={() => setLang(code)}
                aria-pressed={code === lang}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          {!onPlay ? (
            <Link href={`/play?lang=${lang}`} className={classes.play}>
              {t.play}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
