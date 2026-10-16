import { getCountryLabel } from "@/lib/quiz/geoLabels";

/**
 * Review-item renderer passed to the shared <QuizResults /> component for
 * the geography mode's "corrigé" section. Receives the classnames from
 * QuizResults.module.css so the markup stays visually identical to the
 * classic mode's review items.
 */
export function renderGeoReviewItem(
  q,
  index,
  { yourPlayerId, classes, lang = "en" }
) {
  const yourAnswer = q.answers?.[yourPlayerId];
  const missed = !yourAnswer;
  const pickedWrong =
    Boolean(yourAnswer) && yourAnswer.countryCode !== q.correctCode;
  const correctLabel = getCountryLabel(q.correctCode || q.countryCode, lang, q.countryName);
  const wrongLabel = yourAnswer
    ? getCountryLabel(yourAnswer.countryCode, lang, yourAnswer.countryName)
    : "";

  return (
    <article key={q.id} className={classes.reviewItem}>
      <p className={classes.reviewQuestion}>
        {index + 1}. {correctLabel}
      </p>
      <div className={classes.answerCompare}>
        <span className={classes.correct}>✅ {correctLabel}</span>
        {pickedWrong ? (
          <span className={classes.wrong}>❌ {wrongLabel}</span>
        ) : null}
        {missed ? (
          <span className={classes.wrong}>❌ Pas de réponse</span>
        ) : null}
      </div>
    </article>
  );
}
