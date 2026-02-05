import { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { normalizePlatform } from "@/lib/normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/platforms
 * Body: { name: string, orgId: string }
 * Role required: ADMIN or EDITOR
 */
export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { name, orgId } = await req.json();
  if (!name || !orgId) {
    return new Response("name and orgId required", { status: 400 });
  }

  // 🔒 Role enforcement
  const membership = await prisma.membership.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });

  if (!membership || membership.role === "VIEWER") {
    return new Response("Forbidden", { status: 403 });
  }

  const platform = await prisma.platform.create({
    data: {
      key: normalizePlatform(name),
      name,
    },
  });

  return Response.json(platform);
}

/**
 * GET /api/platforms?orgId=xxx
 */
export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const orgId = req.nextUrl.searchParams.get("orgId");
  if (!orgId) return new Response("orgId required", { status: 400 });

  const membership = await prisma.membership.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });

  if (!membership) return new Response("Forbidden", { status: 403 });

  const platforms = await prisma.platform.findMany({
    orderBy: { name: "asc" },
  });

  return Response.json(platforms);
}

