import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orgId, platform, date, amountCents } = body;

  if (!orgId) return new Response("orgId required", { status: 400 });

  // ✅ Role enforcement happens here
  const authz = await requireRole({ orgId, action: "SPEND_WRITE" });
  if (!authz.ok) return new Response(authz.error, { status: authz.status });

  const spend = await prisma.spendEntry.create({
    data: {
      orgId,
      platform,
      date: new Date(date),
      amountCents,
      createdByUserId: authz.userId,
      source: "MANUAL",
    },
  });

  return Response.json({ id: spend.id });
}
