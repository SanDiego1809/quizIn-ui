import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import {
  applySubscriptionToProfile,
  getStripe,
} from "@/lib/stripe/client";

export const runtime = "nodejs";

async function syncSubscription(subscription) {
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id || null;
  const clerkUserId = subscription.metadata?.clerkUserId || null;
  const profileId = subscription.metadata?.userProfileId || null;

  // Prefer lookup by Stripe customer (set at checkout).
  if (stripeCustomerId) {
    const existing = await prisma.userProfile.findUnique({
      where: { stripeCustomerId },
    });
    if (existing) {
      return applySubscriptionToProfile({
        stripeCustomerId,
        subscription,
      });
    }
  }

  if (clerkUserId) {
    return applySubscriptionToProfile({
      clerkUserId,
      stripeCustomerId,
      subscription,
    });
  }

  if (profileId) {
    const profile = await prisma.userProfile.findUnique({
      where: { id: profileId },
    });
    if (profile) {
      return applySubscriptionToProfile({
        clerkUserId: profile.clerkUserId,
        stripeCustomerId: stripeCustomerId || profile.stripeCustomerId,
        subscription,
      });
    }
  }

  console.warn(
    "[stripe/webhook] No profile for subscription",
    subscription.id,
    subscription.metadata
  );
  return null;
}

export async function POST(request) {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    return Response.json(
      { error: "Webhook is not configured." },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] signature", err?.message);
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode !== "subscription") break;

        const clerkUserId =
          session.client_reference_id ||
          session.metadata?.clerkUserId ||
          null;
        const stripeCustomerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id || null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id || null;

        if (stripeCustomerId && clerkUserId) {
          await prisma.userProfile.updateMany({
            where: { clerkUserId },
            data: { stripeCustomerId },
          });
        }

        if (subscriptionId) {
          const stripe = getStripe();
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription);
        } else if (clerkUserId) {
          await prisma.userProfile.update({
            where: { clerkUserId },
            data: {
              plan: "premium",
              ...(stripeCustomerId ? { stripeCustomerId } : {}),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object);
        break;
      }

      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id || null;
        if (subscriptionId) {
          const stripe = getStripe();
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] handler", event.type, err);
    return Response.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}
