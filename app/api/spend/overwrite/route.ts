import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orgId, platformId, date, amountCents, confirm } = body;

  if (!orgId) return new Response("orgId required", { status: 400 });
  if (!platformId) return new Response("platformId required", { status: 400 });
  if (!date) return new Response("date required", { status: 400 });
  if (confirm !== "overwrite") {
    return new Response("Confirmation required", { status: 400 });
  }

  const authz = await requireRole({ orgId, action: "SPEND_WRITE" });
  if (!authz.ok) return new Response(authz.error, { status: authz.status });

  const parsedDate = new Date(date);
  const existing = await prisma.spendEntry.findFirst({
    where: { orgId, platformId, date: parsedDate },
  });

  if (!existing) return new Response("Not found", { status: 404 });

  if (existing.amountCents === amountCents) {
    return new Response("DUPLICATE_SAME", { status: 409 });
  }

  const updated = await prisma.spendEntry.update({
    where: { id: existing.id },
    data: { amountCents },
  });

  await prisma.editLog.create({
    data: {
      orgId,
      platformId,
      userId: authz.userId,
      previousAmountCents: existing.amountCents,
      newAmountCents: amountCents,
    },
  });

  return Response.json({ id: updated.id });
}
