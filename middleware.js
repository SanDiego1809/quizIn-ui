import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const authEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

const isProtectedRoute = createRouteMatcher([
  "/profile(.*)",
  "/api/me(.*)",
  "/api/stripe/checkout(.*)",
  "/api/stripe/portal(.*)",
]);

// Stripe signs /api/stripe/webhook — do not require a Clerk session.
const isStripeWebhook = createRouteMatcher(["/api/stripe/webhook(.*)"]);

export default authEnabled
  ? clerkMiddleware(async (auth, req) => {
      if (isStripeWebhook(req)) {
        return NextResponse.next();
      }
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
    })
  : function middleware() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
