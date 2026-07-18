import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      session: null,
      userId: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    session,
    userId: session.user.id,
    response: null,
  };
}
