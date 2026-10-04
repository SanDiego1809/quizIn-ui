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

export default function PlayPage() {
  return (
    <Suspense fallback={<PlayLoading />}>
      <PlayRoom />
    </Suspense>
  );
}
