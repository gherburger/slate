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

  return (
    <section className="dashboard-shell">
      <div className="dashboard-card">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>{spendCount} spend entries</p>
        </div>
        <div className="content-copy">
          <p>
            My Data view moved to{" "}
            <code>/org/{orgId}/mydata</code>.
          </p>
        </div>
      </div>
    </section>
  );
}
