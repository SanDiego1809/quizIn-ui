"use client";

import Link from "next/link";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { useLang } from "@/components/site/LangProvider";
import { getTranslations } from "@/lib/i18n";
import classes from "./AuthControls.module.css";

export default function AuthControls() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return null;
  }

  const { lang } = useLang();
  const t = getTranslations(lang).site;

  return (
    <div className={classes.wrap}>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button type="button" className={classes.signIn}>
            {t.signIn}
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button type="button" className={classes.signUp}>
            {t.signUp}
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link href={`/profile?lang=${lang}`} className={classes.profile}>
          {t.profile}
        </Link>
        <UserButton afterSignOutUrl="/" />
      </Show>
    </div>
  );
}
