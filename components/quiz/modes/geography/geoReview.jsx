/**
 * Review-item renderer passed to the shared <QuizResults /> component for
 * the geography mode's "corrigé" section. Receives the classnames from
 * QuizResults.module.css so the markup stays visually identical to the
 * classic mode's review items.
 */
export function renderGeoReviewItem(q, index, { yourPlayerId, classes }) {
  const yourAnswer = q.answers?.[yourPlayerId];
  const missed = !yourAnswer;
  const pickedWrong = Boolean(yourAnswer) && yourAnswer.countryCode !== q.correctCode;

  return (
    <article key={q.id} className={classes.reviewItem}>
      <p className={classes.reviewQuestion}>
        {index + 1}. {q.countryName}
      </p>
      <div className={classes.answerCompare}>
        <span className={classes.correct}>✅ {q.countryName}</span>
        {pickedWrong ? (
          <span className={classes.wrong}>❌ {yourAnswer.countryName}</span>
        ) : null}
        {missed ? (
          <span className={classes.wrong}>❌ Pas de réponse</span>
        ) : null}
      </div>
    </article>
  );
}
