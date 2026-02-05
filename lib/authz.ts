import "server-only";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export type Action = "ORG_MANAGE" | "SPEND_WRITE" | "SPEND_READ";

// Map actions → minimum role required
const ACTION_MIN_ROLE: Record<Action, Role> = {
  ORG_MANAGE: "ADMIN",
  SPEND_WRITE: "EDITOR",
  SPEND_READ: "VIEWER",
};

const ROLE_RANK: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
};

export async function requireRole(params: {
  orgId: string;
  action: Action;
}) {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const membership = await prisma.membership.findUnique({
    where: { orgId_userId: { orgId: params.orgId, userId } },
    select: { role: true },
  });

  if (!membership) {
    return { ok: false as const, status: 403, error: "Not a member of org" };
  }

  const required = ACTION_MIN_ROLE[params.action];
  const allowed =
    ROLE_RANK[membership.role] >= ROLE_RANK[required];

  if (!allowed) {
    return {
      ok: false as const,
      status: 403,
      error: `Forbidden: requires ${required}`,
    };
  }

  return { ok: true as const, userId, role: membership.role };
}
