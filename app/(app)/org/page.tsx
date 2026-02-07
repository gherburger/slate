import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

function mapClerkRole(role: string | null | undefined) {
  const value = role?.toLowerCase() ?? "";
  if (value.includes("admin")) return "ADMIN" as const;
  if (value.includes("editor")) return "EDITOR" as const;
  return "VIEWER" as const;
}

export default async function OrgIndexPage() {
  const { orgId, userId } = await auth();
  if (!userId) return redirect("/sign-in");
  if (!orgId) return redirect("/organization-profile");

  const existingOrg = await prisma.org.findUnique({
    where: { externalId: orgId },
  });

  let dbOrg = existingOrg;
  if (!dbOrg) {
    const clerk = await clerkClient();
    const org = await clerk.organizations.getOrganization({ organizationId: orgId });
    dbOrg = await prisma.org.create({
      data: { externalId: org.id, name: org.name },
    });
  }

  const existingMembership = await prisma.membership.findFirst({
    where: { orgId: dbOrg.id, userId },
  });

  if (!existingMembership) {
    const clerk = await clerkClient();
    const memberships = await clerk.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 50,
    });
    const match = memberships.data.find((m) => m.publicUserData?.userId === userId);
    const role = mapClerkRole(match?.role);

    await prisma.membership.create({
      data: { orgId: dbOrg.id, userId, role },
    });
  }

  return redirect(`/org/${dbOrg.id}/dashboard`);
}
