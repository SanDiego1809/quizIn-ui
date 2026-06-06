import classes from "./QuizLobby.module.css";
import Button from "@/components/button/Button";

export default function QuizLobby({
  onCreate,
  onJoin,
  connected,
  connectionError,
}) {
  return (
    <section className={classes.panel}>
      <h2 className={classes.heading}>Join a quiz room</h2>
      {connected ? (
        <p className={classes.statusOk}>Connected to game server</p>
      ) : connectionError ? (
        <p className={classes.statusError} role="alert">
          {connectionError}
        </p>
      ) : (
        <p className={classes.hint}>Connecting to game server…</p>
      )}

      <form
        className={classes.form}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          onCreate(String(data.get("name") || ""));
        }}
      >
        <label className={classes.label}>
          Your name
          <input
            name="name"
            className={classes.input}
            placeholder="Alex"
            maxLength={30}
            required
          />
        </label>
        <Button type="submit" disabled={!connected}>
          Create room
        </Button>
      </form>

      <div className={classes.divider}>or</div>

      <form
        className={classes.form}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          onJoin(
            String(data.get("roomCode") || ""),
            String(data.get("name") || "")
          );
        }}
      >
        <label className={classes.label}>
          Room code
          <input
            name="roomCode"
            className={classes.input}
            placeholder="ABC123"
            maxLength={6}
            required
          />
        </label>
        <label className={classes.label}>
          Your name
          <input
            name="name"
            className={classes.input}
            placeholder="Alex"
            maxLength={30}
            required
          />
        </label>
        <Button type="submit" variant="secondary" disabled={!connected}>
          Join room
        </Button>
      </form>
    </section>
  );
}
