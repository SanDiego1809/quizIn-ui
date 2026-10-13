/**
 * Reports whether Stripe env vars are set (no secret values printed).
 * Loads .env.local the same way as scripts/with-env-local.js.
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const loaded = {};

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    loaded[key] = value;
  }
}

function report(name) {
  const value = loaded[name] || "";
  const set = value.length > 0;
  const prefix = set ? value.slice(0, Math.min(7, value.length)) : "";
  return { name, set, length: value.length, prefixHint: set ? `${prefix}…` : "(empty)" };
}

const keys = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_PREMIUM_MONTHLY",
  "STRIPE_WEBHOOK_SECRET",
];

console.log(".env.local exists:", fs.existsSync(envPath));
for (const key of keys) {
  console.log(report(key));
}

const ok =
  (loaded.STRIPE_SECRET_KEY || "").length > 0 &&
  (loaded.STRIPE_PRICE_PREMIUM_MONTHLY || "").length > 0;
console.log("isStripeConfigured would be:", ok);
if (!ok) {
  console.log(
    "\nFix: set non-empty STRIPE_SECRET_KEY and STRIPE_PRICE_PREMIUM_MONTHLY in .env.local, then restart npm run dev:all"
  );
}
