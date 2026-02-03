
import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { name } = await req.json();
  if (!name) return new Response("Name required", { status: 400 });

  // 1. Get Clerk client and create org
  const clerk = await clerkClient();
  const org = await clerk.organizations.createOrganization({
    name,
    createdBy: userId,
  });

  // 2. Persist org in Postgres
  await prisma.org.create({
    data: {
      externalId: org.id,
      name: org.name,
    },
  });

  return new Response(JSON.stringify({ orgId: org.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
