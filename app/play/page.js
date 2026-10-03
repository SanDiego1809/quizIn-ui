import { Suspense } from "react";
import PlayRoom from "./PlayRoom";
import classes from "./page.module.css";

function PlayLoading() {
  return (
    <main>
      <p className={classes.backLink}>Loading quiz room…</p>
    </main>
  );
}

export default async function PlayPage({ searchParams }) {
  const params = await searchParams;
  const lang = params?.lang || undefined;
  return (
    <Suspense fallback={<PlayLoading />}>
      <PlayRoom lang={lang} />
    </Suspense>
  );
}
