import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BulkRow = {
  date: string;
  amountCents: number;
};

function validateDate(date: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return false;
  const [mm, dd, yyyy] = date.split("/").map(Number);
  if (mm < 1 || mm > 12) return false;
  const maxDay = new Date(yyyy, mm, 0).getDate();
  return dd >= 1 && dd <= maxDay;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const orgId = body.orgId as string | undefined;
  const platformId = body.platformId as string | undefined;
  const rows = body.rows as BulkRow[] | undefined;

  if (!orgId) return new Response("orgId required", { status: 400 });
  if (!platformId) return new Response("platformId required", { status: 400 });
  if (!Array.isArray(rows) || rows.length === 0) {
    return new Response("rows required", { status: 400 });
  }

  const authz = await requireRole({ orgId, action: "SPEND_WRITE" });
  if (!authz.ok) return new Response(authz.error, { status: authz.status });

  const platform = await prisma.platform.findFirst({
    where: { id: platformId, orgId },
    select: { id: true },
  });

  if (!platform) return new Response("platform not found", { status: 404 });

  for (const row of rows) {
    if (!row || typeof row.date !== "string" || !validateDate(row.date)) {
      return new Response("invalid row date", { status: 400 });
    }
    if (!Number.isInteger(row.amountCents) || !Number.isFinite(row.amountCents)) {
      return new Response("invalid row amount", { status: 400 });
    }
  }

  const parsedRows = rows.map((row) => ({
    date: new Date(row.date),
    amountCents: row.amountCents,
  }));

  const dateTimes = parsedRows.map((row) => row.date.getTime());

  const result = await prisma.$transaction(async (tx) => {
    const existingEntries = await tx.spendEntry.findMany({
      where: {
        orgId,
        platformId,
        date: { in: parsedRows.map((row) => row.date) },
      },
      select: { id: true, date: true, amountCents: true },
    });

    const existingByDate = new Map<number, { id: string; amountCents: number }>();
    for (const entry of existingEntries) {
      existingByDate.set(entry.date.getTime(), {
        id: entry.id,
        amountCents: entry.amountCents,
      });
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < parsedRows.length; i += 1) {
      const row = parsedRows[i];
      const time = dateTimes[i];
      const existing = existingByDate.get(time);

      if (!existing) {
        const created = await tx.spendEntry.create({
          data: {
            orgId,
            platformId,
            date: row.date,
            amountCents: row.amountCents,
            createdByUserId: authz.userId,
            source: "BULK_IMPORT",
          },
          select: { id: true },
        });

        insertedCount += 1;
        existingByDate.set(time, {
          id: created.id,
          amountCents: row.amountCents,
        });
        continue;
      }

      if (existing.amountCents === row.amountCents) {
        continue;
      }

      await tx.spendEntry.update({
        where: { id: existing.id },
        data: {
          amountCents: row.amountCents,
          source: "BULK_IMPORT",
        },
      });

      await tx.editLog.create({
        data: {
          orgId,
          platformId,
          userId: authz.userId,
          previousAmountCents: existing.amountCents,
          newAmountCents: row.amountCents,
        },
      });

      updatedCount += 1;
      existingByDate.set(time, {
        id: existing.id,
        amountCents: row.amountCents,
      });
    }

    return {
      insertedCount,
      updatedCount,
      totalCount: parsedRows.length,
    };
  });

  return Response.json(result);
}
