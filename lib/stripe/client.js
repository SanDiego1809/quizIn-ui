import Stripe from "stripe";
import { prisma } from "@/lib/db/prisma";

let stripeSingleton = null;

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PREMIUM_MONTHLY
  );
}

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeSingleton;
}

export function getSiteUrl() {
  const url = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  return url;
}

export function planFromSubscriptionStatus(status) {
  if (status === "active" || status === "trialing") return "premium";
  return "free";
}

/**
 * Ensure the profile has a Stripe Customer and return its id.
 */
export async function getOrCreateStripeCustomer(profile, email) {
  if (profile.stripeCustomerId) {
    return profile.stripeCustomerId;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: {
      clerkUserId: profile.clerkUserId,
      userProfileId: profile.id,
    },
  });

  await prisma.userProfile.update({
    where: { id: profile.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function applySubscriptionToProfile({
  clerkUserId,
  stripeCustomerId,
  subscription,
}) {
  const status = subscription?.status || null;
  const plan = planFromSubscriptionStatus(status);
  const subscriptionId = subscription?.id || null;

  const where = clerkUserId
    ? { clerkUserId }
    : stripeCustomerId
      ? { stripeCustomerId }
      : null;

  if (!where) {
    throw new Error("Missing clerkUserId or stripeCustomerId for plan sync.");
  }

  return prisma.userProfile.update({
    where,
    data: {
      plan,
      stripeSubscriptionId: subscriptionId,
      stripeSubscriptionStatus: status,
      ...(stripeCustomerId ? { stripeCustomerId } : {}),
    },
  });
}
