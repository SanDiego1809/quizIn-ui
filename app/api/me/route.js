import { auth, currentUser } from "@clerk/nextjs/server";
import {
  ensureUserProfile,
  serializeProfile,
  updateUserProfile,
} from "@/lib/db/profile";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { isClerkEnabled } from "@/lib/auth/clerk";

export async function GET() {
  if (!isClerkEnabled()) {
    return Response.json({ error: "Auth is not configured." }, { status: 503 });
  }
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "Database is not configured." },
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

  const profile = await ensureUserProfile(userId, { displayName });
  return Response.json({ profile: serializeProfile(profile) });
}

export async function PATCH(request) {
  if (!isClerkEnabled()) {
    return Response.json({ error: "Auth is not configured." }, { status: 503 });
  }
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureUserProfile(userId);

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const profile = await updateUserProfile(userId, {
      displayName: body.displayName,
      avatarKey: body.avatarKey,
    });
    return Response.json({ profile: serializeProfile(profile) });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Could not update profile." },
      { status: 400 }
    );
  }
}
