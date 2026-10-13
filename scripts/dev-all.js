/**
 * Start Next.js, the socket server, and Stripe CLI webhook forwarding together.
 * Usage: npm run dev:all
 *
 * Requires the Stripe CLI on PATH for local billing tests:
 *   https://stripe.com/docs/stripe-cli
 * Copy the printed whsec_… into .env.local as STRIPE_WEBHOOK_SECRET, then restart
 * this script (or at least Next) if the secret changed.
 */
const { spawn } = require("child_process");

const STRIPE_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
].join(",");

const children = [];

function start(name, command, args, color) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.push(child);

  const prefix = (stream) => {
    stream.on("data", (buf) => {
      const text = buf.toString();
      for (const line of text.split(/\r?\n/)) {
        if (line.length === 0) continue;
        process.stdout.write(`${color}[${name}]\x1b[0m ${line}\n`);
      }
    });
  };

  prefix(child.stdout);
  prefix(child.stderr);

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(
      `\x1b[31m[${name}]\x1b[0m exited (code=${code}, signal=${signal}). Stopping others…`
    );
    shutdown(code ?? 1);
  });

  return child;
}

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      // ignore
    }
  }
  setTimeout(() => process.exit(code), 300).unref();
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("Starting Next.js, socket server, and Stripe webhook forwarder…");
console.log(
  "If Stripe prints a new whsec_…, put it in .env.local as STRIPE_WEBHOOK_SECRET.\n"
);

start("next", "npm", ["run", "dev"], "\x1b[36m");
start("socket", "npm", ["run", "dev:socket"], "\x1b[33m");
start(
  "stripe",
  "stripe",
  [
    "listen",
    "--forward-to",
    "localhost:3000/api/stripe/webhook",
    "--events",
    STRIPE_EVENTS,
  ],
  "\x1b[35m"
);
