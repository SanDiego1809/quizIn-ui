import { auth } from "@clerk/nextjs/server";
import { getProfileByClerkId } from "@/lib/db/profile";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { isClerkEnabled } from "@/lib/auth/clerk";
import {
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

  const profile = await getProfileByClerkId(userId);
  if (!profile?.stripeCustomerId) {
    return Response.json(
      { error: "No billing account found. Subscribe first." },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${getSiteUrl()}/profile`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    return Response.json(
      { error: err?.message || "Could not open billing portal." },
      { status: 500 }
    );
  }
}
