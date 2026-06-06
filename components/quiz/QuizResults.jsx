import classes from "./QuizResults.module.css";
import Button from "@/components/button/Button";

export default function QuizResults({ room, isHost, onReset }) {
  const { result, questionReview } = room;

  return (
    <section className={classes.panel}>
      <h2 className={classes.heading}>Final scores</h2>

      <ol className={classes.rankings}>
        {result?.rankings.map((entry, index) => (
          <li key={entry.playerId} className={classes.rankRow}>
            <span className={classes.place}>#{index + 1}</span>
            <span className={classes.name}>{entry.name}</span>
            <span className={classes.score}>
              {entry.score}/{result.totalQuestions}
            </span>
          </li>
        ))}
      </ol>

      {questionReview?.length ? (
        <div className={classes.review}>
          <h3 className={classes.subheading}>Answer key</h3>
          {questionReview.map((q, index) => (
            <article key={q.id} className={classes.reviewItem}>
              <p className={classes.reviewQuestion}>
                {index + 1}. {q.text}
              </p>
              <p className={classes.correct}>
                Correct: {q.options[q.correctIndex]}
              </p>
            </article>
          ))}
        </div>
      ) : null}

      {isHost ? (
        <Button onClick={onReset}>Play again</Button>
      ) : (
        <p className={classes.hint}>Waiting for the host to start a new round…</p>
      )}
    </section>
  );
}
