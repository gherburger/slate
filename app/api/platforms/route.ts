import { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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

  const { name, orgId, provider } = await req.json();
  if (!name || !orgId) {
    return new Response("name and orgId required", { status: 400 });
  }

  const trimmedName = String(name).trim();
  const validName = /^[a-zA-Z0-9 _\-()]+$/.test(trimmedName);
  if (!validName) {
    return new Response("Invalid name format", { status: 400 });
  }
  const normalizedKey = normalizePlatform(trimmedName);

  // 🔒 Role enforcement
  const membership = await prisma.membership.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });

  if (!membership || membership.role === "VIEWER") {
    return new Response("Forbidden", { status: 403 });
  }

  if (provider) {
    const existingProvider = await prisma.platform.findFirst({
      where: { orgId, provider },
      select: { id: true },
    });
    if (existingProvider) {
      return new Response("PROVIDER_EXISTS", { status: 409 });
    }
  }

  let platform;
  try {
    platform = await prisma.platform.create({
      data: {
        key: normalizedKey,
        name: trimmedName,
        orgId,
        provider: provider ?? null,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return new Response("ALREADY_EXISTS", { status: 409 });
    }
    throw err;
  }

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
    where: { orgId },
    orderBy: { name: "asc" },
  });

  return Response.json(platforms);
}
