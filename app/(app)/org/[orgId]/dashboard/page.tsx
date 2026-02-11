// app/org/[orgId]/dashboard/page.tsx
import { prisma } from "@/lib/prisma";
import AddRecordModal from "@/app/(app)/org/[orgId]/mydata/AddRecordModal";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const spendCount = await prisma.spendEntry.count({
    where: { orgId },
  });

  const platforms = await prisma.platform.findMany({
    where: { orgId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
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
        <div style={{ marginTop: 20 }}>
          <AddRecordModal orgId={orgId} platforms={platforms} />
        </div>
      </div>
    </section>
  );
}
