import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const spendEntryId = ctx.params.id;
  const body = await req.json();

  const { orgId, platformId, date, amountCents, currency, notes } = body;
  if (!orgId) return new Response("orgId required", { status: 400 });

  const authz = await requireRole({ orgId, action: "SPEND_WRITE" });
  if (!authz.ok) return new Response(authz.error, { status: authz.status });

  const platform = platformId
    ? await prisma.platform.findUnique({
        where: { id: platformId },
        select: { id: true, key: true },
      })
    : null;

  if (platformId && !platform) {
    return new Response("platform not found", { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.spendEntry.findFirst({
      where: { id: spendEntryId, orgId },
    });

    if (!existing) return { status: 404 as const };

    const updated = await tx.spendEntry.update({
      where: { id: spendEntryId },
      data: {
        platformId: platform?.id,
        platformKey: platform?.key,
        date: date ? new Date(date) : undefined,
        amountCents,
        currency,
        notes,
        source: "BULK_PASTE",
      },
    });

    await tx.spendAudit.create({
      data: {
        orgId,
        spendEntryId: existing.id,
        action: "OVERWRITE",
        beforeJson: existing,
        afterJson: updated,
        actorUserId: authz.userId,
      },
    });

    return { status: 200 as const, updated };
  });

  if (result.status === 404) return new Response("Not found", { status: 404 });

  return Response.json({ ok: true, spendEntry: result.updated });
}
