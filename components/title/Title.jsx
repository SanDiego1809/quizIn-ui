import classes from "./Title.module.css";

export default function Title({ children, subtitle, as: Tag = "h1" }) {
  return (
    <header className={classes.wrapper}>
      <Tag className={classes.title}>{children}</Tag>
      {subtitle ? <p className={classes.subtitle}>{subtitle}</p> : null}
    </header>
  );
}
