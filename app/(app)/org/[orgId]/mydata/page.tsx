// app/org/[orgId]/mydata/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import MyDataClient from "@/app/(app)/org/[orgId]/mydata/MyDataClient";

export default async function TablesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const { userId } = await auth();
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { userType: true },
      })
    : null;
  const isInternal = user?.userType === "INTERNAL";

  const customPlatforms = await prisma.platform.findMany({
    where: { orgId, provider: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const integrationPlatforms = await prisma.platform.findMany({
    where: { orgId, provider: { not: null } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <section className="tables-shell">
      <MyDataClient
        orgId={orgId}
        customPlatforms={customPlatforms}
        integrationPlatforms={integrationPlatforms}
        isInternal={isInternal}
      />
    </section>
  );
}
