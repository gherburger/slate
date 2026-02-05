export const runtime = "nodejs";

import { getAuth, currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const name = user?.fullName ?? null;
  const avatarUrl = user?.imageUrl ?? null;

  await prisma.user.upsert({
    where: { id: userId },
    update: {
      email: email ?? undefined,
      name: name ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
    },
    create: {
      id: userId,
      email: email ?? "",
      name,
      avatarUrl,
    },
  });

  return Response.json({
    userId,
    email,
    name,
    avatarUrl,
  });
}
