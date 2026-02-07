// app/org/[orgId]/layout.tsx
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const { userId } = await auth();
  if (!userId) return redirect("/sign-in");

  const membership = await prisma.membership.findFirst({
    where: { orgId, userId },
    include: { org: true },
  });

  if (!membership) return redirect("/403");

  return <>{children}</>;
}
