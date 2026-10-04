"use client";

import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { useLang } from "./LangProvider";
import classes from "./SiteFooter.module.css";

export default function SiteFooter() {
  const { lang } = useLang();
  const t = getTranslations(lang).site;

  return (
    <footer className={classes.footer}>
      <Link href={`/privacy?lang=${lang}`} className={classes.link}>
        {t.privacy}
      </Link>
      <Link href={`/contact?lang=${lang}`} className={classes.link}>
        {t.contact}
      </Link>
    </footer>
  );
}
