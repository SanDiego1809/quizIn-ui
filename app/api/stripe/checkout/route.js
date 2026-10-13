import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureUserProfile } from "@/lib/db/profile";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { isClerkEnabled } from "@/lib/auth/clerk";
import {
  getOrCreateStripeCustomer,
  getSiteUrl,
  getStripe,
  isStripeConfigured,
} from "@/lib/stripe/client";

export async function POST() {
  if (!isClerkEnabled()) {
    return Response.json({ error: "Auth is not configured." }, { status: 503 });
  }
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }
  if (!isStripeConfigured()) {
    return Response.json(
      { error: "Billing is not configured." },
      { status: 503 }
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const displayName =
    user?.username ||
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    "Player";
  const email = user?.emailAddresses?.[0]?.emailAddress || undefined;

  const profile = await ensureUserProfile(userId, { displayName });

  if (
    profile.plan === "premium" &&
    (profile.stripeSubscriptionStatus === "active" ||
      profile.stripeSubscriptionStatus === "trialing")
  ) {
    return Response.json(
      { error: "Already subscribed to Premium." },
      { status: 400 }
    );
  }

  try {
    const customerId = await getOrCreateStripeCustomer(profile, email);
    const stripe = getStripe();
    const siteUrl = getSiteUrl();
    const priceId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/profile?billing=success`,
      cancel_url: `${siteUrl}/profile?billing=canceled`,
      metadata: {
        clerkUserId: userId,
        userProfileId: profile.id,
      },
      subscription_data: {
        metadata: {
          clerkUserId: userId,
          userProfileId: profile.id,
        },
      },
    });

    if (!session.url) {
      return Response.json(
        { error: "Could not create checkout session." },
        { status: 500 }
      );
    }

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return Response.json(
      { error: err?.message || "Could not start checkout." },
      { status: 500 }
    );
  }
}
