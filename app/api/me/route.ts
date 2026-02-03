export const runtime = "nodejs";

import { getAuth, currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await currentUser();

  return Response.json({
    userId,
    email: user?.emailAddresses?.[0]?.emailAddress ?? null,
  });
}
