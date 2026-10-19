import styles from "./EarthGlobe.module.css";

const STARS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"];

function Spark() {
  return (
    <>
      <span className={styles.half}>
        <span className={`${styles.corner} ${styles.br}`} />
        <span className={`${styles.corner} ${styles.bl}`} />
      </span>
      <span className={styles.half}>
        <span className={`${styles.corner} ${styles.tr}`} />
        <span className={`${styles.corner} ${styles.tl}`} />
      </span>
    </>
  );
}

/** Rotating earth adapted from Lakshay-art (MIT): https://uiverse.io/Lakshay-art/soft-dingo-98 */
export default function EarthGlobe() {
  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.globe}>
        {STARS.map((id) => (
          <span key={id} className={`${styles.star} ${styles[id]}`}>
            <Spark />
          </span>
        ))}
      </div>
    </div>
  );
}
