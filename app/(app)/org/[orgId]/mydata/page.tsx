// app/org/[orgId]/mydata/page.tsx
import { prisma } from "@/lib/prisma";
import AddRecordModal from "@/app/(app)/org/[orgId]/mydata/AddRecordModal";

export default async function TablesPage({
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
    <section className="tables-shell">
      <aside className="tables-sidebar">
        <div className="tables-header page-header">
          <h1>My Data</h1>
        </div>
        <div className="tables-group">
          <p className="sidebar-title">Custom</p>
          <div className="tables-list">
            {["_prisma_migrations", "Membership", "Org", "Platform"].map(
              (name) => (
                <div
                  key={name}
                  className={`tables-item ${name === "Org" ? "is-active" : ""}`}
                >
                  <span className="tables-icon">▦</span>
                  {name}
                </div>
              )
            )}
          </div>
        </div>
        <div className="tables-group">
          <p className="sidebar-title">Integrations</p>
          <div className="tables-list">
            {["SpendAudit", "SpendEntry", "User", "WebhookEvent"].map((name) => (
              <div key={name} className="tables-item">
                <span className="tables-icon">▦</span>
                {name}
              </div>
            ))}
          </div>
        </div>
      </aside>
      <div className="tables-main">
        <div className="tables-toolbar">
          <div className="toolbar-group">
            <button className="ghost-icon">▣</button>
            <button className="ghost-icon">▦</button>
            <button className="ghost-icon">☰</button>
          </div>
          <div className="toolbar-group">
            <button className="ghost-icon">‹</button>
            <button className="ghost-icon">›</button>
          </div>
          <div className="toolbar-group">
            <button className="ghost-pill">Filters</button>
            <button className="ghost-pill">Columns</button>
            <AddRecordModal />
          </div>
          <div className="toolbar-group is-right">
            <span className="toolbar-meta">2 rows · 46ms</span>
            <button className="ghost-pill">50</button>
            <button className="ghost-icon">⟳</button>
            <button className="ghost-icon">⋯</button>
          </div>
        </div>
        <div className="tables-card">
          <table className="data-table">
            <thead>
              <tr>
                <th />
                <th>id</th>
                <th>platform</th>
                <th>amount</th>
                <th>date</th>
                <th>currency</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td className="mono">{entry.id.slice(0, 12)}…</td>
                  <td>{entry.platform?.name ?? entry.platformKey}</td>
                  <td>{(entry.amountCents / 100).toFixed(2)}</td>
                  <td>
                    {new Date(entry.date).toLocaleString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <span className="pill">{entry.currency}</span>
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
