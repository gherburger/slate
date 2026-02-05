// app/org/[orgId]/dashboard/page.tsx
import { prisma } from "@/lib/prisma";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const spendCount = await prisma.spendEntry.count({
    where: { orgId },
  });

  const recent = await prisma.spendEntry.findMany({
    where: { orgId },
    orderBy: { date: "desc" },
    take: 10,
    include: { platform: true },
  });

  return (
    <main>
      <h1 style={{ margin: 0 }}>Dashboard</h1>
      <p style={{ opacity: 0.8 }}>Spend entries: {spendCount}</p>

      <h2 style={{ marginTop: 24 }}>Recent entries</h2>
      <ul>
        {recent.map((e) => (
          <li key={e.id}>
            {e.platform?.name ?? e.platformKey} — {e.amountCents / 100}{" "}
            {e.currency} —{" "}
            {new Date(e.date).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </main>
  );
}
