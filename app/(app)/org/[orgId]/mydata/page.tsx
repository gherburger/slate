// app/org/[orgId]/mydata/page.tsx
import { prisma } from "@/lib/prisma";
import { CirclePlus } from "lucide-react";
import AddDataSetModal from "@/app/(app)/org/[orgId]/mydata/AddDataSetModal";
import AddRecordModal from "@/app/(app)/org/[orgId]/mydata/AddRecordModal";
import Link from "next/link";

export default async function TablesPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams?: { platformId?: string };
}) {
  const { orgId } = await params;

  const customPlatforms = await prisma.platform.findMany({
    where: { scope: "ORG", orgId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const integrationPlatforms = await prisma.platform.findMany({
    where: { scope: "GLOBAL" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const selectedPlatformId =
    searchParams?.platformId ??
    customPlatforms[0]?.id ??
    integrationPlatforms[0]?.id ??
    null;

  const entries = selectedPlatformId
    ? await prisma.spendEntry.findMany({
        where: { orgId, platformId: selectedPlatformId },
        orderBy: { date: "desc" },
        take: 50,
      })
    : [];

  const baseHref = `/org/${orgId}/mydata`;

  return (
    <section className="tables-shell">
      <aside className="tables-sidebar">
        <div className="tables-header page-header">
          <h1>My Data</h1>
        </div>
        <div className="tables-group">
          <p className="sidebar-title">Custom</p>
          <div className="tables-list">
            {customPlatforms.map((platform) => {
              const isActive = platform.id === selectedPlatformId;
              return (
                <Link
                  key={platform.id}
                  href={`${baseHref}?platformId=${platform.id}`}
                  className={`tables-item ${isActive ? "is-active" : ""}`}
                >
                  {platform.name}
                </Link>
              );
            })}
            <AddDataSetModal orgId={orgId}>
              <CirclePlus size={16} aria-hidden="true" />
              Add New Data Set
            </AddDataSetModal>
          </div>
        </div>
        <div className="tables-group">
          <p className="sidebar-title">Integrations</p>
          <div className="tables-list">
            {integrationPlatforms.map((platform) => {
              const isActive = platform.id === selectedPlatformId;
              return (
                <Link
                  key={platform.id}
                  href={`${baseHref}?platformId=${platform.id}`}
                  className={`tables-item ${isActive ? "is-active" : ""}`}
                >
                  {platform.name}
                </Link>
              );
            })}
            <div className="tables-item tables-item-add">
              <CirclePlus size={16} aria-hidden="true" />
              Add New App
            </div>
          </div>
        </div>
      </aside>
      <div className="tables-main">
        <div className="tables-toolbar">
          <div className="toolbar-group">
            <button className="ghost-pill">Filters</button>
            <button className="ghost-pill">Columns</button>
            <AddRecordModal />
          </div>
          <div className="toolbar-group is-right">
            <span className="toolbar-meta">{entries.length} rows</span>
            <button className="ghost-pill">50</button>
            <button className="ghost-icon">⟳</button>
            <button className="ghost-icon">⋯</button>
          </div>
        </div>
        <div className="tables-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>id</th>
                <th>orgId</th>
                <th>platformId</th>
                <th>date</th>
                <th>amountCents</th>
                <th>currency</th>
                <th>source</th>
                <th>notes</th>
                <th>createdByUserId</th>
                <th>createdAt</th>
                <th>updatedAt</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="mono">{entry.id}</td>
                  <td className="mono">{entry.orgId}</td>
                  <td className="mono">{entry.platformId}</td>
                  <td>{entry.date.toISOString()}</td>
                  <td>{entry.amountCents}</td>
                  <td>{entry.currency}</td>
                  <td>{entry.source}</td>
                  <td>{entry.notes ?? ""}</td>
                  <td className="mono">{entry.createdByUserId ?? ""}</td>
                  <td>{entry.createdAt.toISOString()}</td>
                  <td>{entry.updatedAt.toISOString()}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={11} className="empty-row">
                    No data yet. Choose Add Record to get started.
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
