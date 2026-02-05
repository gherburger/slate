import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Read-only endpoint by design. Do not add POST/PUT/DELETE.
export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId");
  if (!orgId) return new Response("orgId required", { status: 400 });

  const authz = await requireRole({ orgId, action: "SPEND_READ" });
  if (!authz.ok) return new Response(authz.error, { status: authz.status });

  const audits = await prisma.spendAudit.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json(audits);
}
