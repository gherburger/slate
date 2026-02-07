import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orgId, platformId, date, amountCents } = body;

  if (!orgId) return new Response("orgId required", { status: 400 });
  if (!platformId) return new Response("platformId required", { status: 400 });

  // ✅ Role enforcement happens here
  const authz = await requireRole({ orgId, action: "SPEND_WRITE" });
  if (!authz.ok) return new Response(authz.error, { status: authz.status });

  const platform = await prisma.platform.findUnique({
    where: { id: platformId },
    select: { id: true },
  });

  if (!platform) return new Response("platform not found", { status: 404 });

  try {
    const spend = await prisma.spendEntry.create({
      data: {
        orgId,
        platformId: platform.id,
        date: new Date(date),
        amountCents,
        createdByUserId: authz.userId,
        source: "MANUAL",
      },
    });

    return Response.json({ id: spend.id });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return Response.json(
        {
          error: "DUPLICATE_SPEND_ENTRY",
          message: "Spend entry already exists for org + date + platform.",
          key: { orgId, date, platformId },
        },
        { status: 409 }
      );
    }

    throw e;
  }
}
