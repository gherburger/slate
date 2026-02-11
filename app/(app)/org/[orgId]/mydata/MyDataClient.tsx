"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AddRecordModal from "@/app/(app)/org/[orgId]/mydata/AddRecordModal";
import AddDataSetModal from "@/app/(app)/org/[orgId]/mydata/AddDataSetModal";
import PlatformMenu from "@/app/(app)/org/[orgId]/mydata/PlatformMenu";
import { CirclePlus } from "lucide-react";

type PlatformItem = {
  id: string;
  name: string;
};

type SpendEntry = {
  id: string;
  orgId: string;
  platformId: string;
  date: string;
  amountCents: number;
  currency: string;
  source: string;
  notes: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function MyDataClient({
  orgId,
  customPlatforms,
  integrationPlatforms,
}: {
  orgId: string;
  customPlatforms: PlatformItem[];
  integrationPlatforms: PlatformItem[];
}) {
  const searchParams = useSearchParams();
  const queryPlatformId = searchParams.get("platformId");
  const defaultPlatformId =
    customPlatforms[0]?.id ?? integrationPlatforms[0]?.id ?? null;
  const selectedPlatformId = queryPlatformId ?? defaultPlatformId;

  const [entries, setEntries] = useState<SpendEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const allPlatforms = useMemo(
    () => [...customPlatforms, ...integrationPlatforms],
    [customPlatforms, integrationPlatforms]
  );

  useEffect(() => {
    if (!selectedPlatformId) return;
    let active = true;
    setLoading(true);
    fetch(
      `/api/spend?orgId=${encodeURIComponent(
        orgId
      )}&platformId=${encodeURIComponent(selectedPlatformId)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (active) setEntries(data.entries ?? []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orgId, selectedPlatformId, refreshKey]);

  const baseHref = `/org/${orgId}/mydata`;

  return (
    <>
      <aside className="tables-sidebar">
        <div className="tables-header page-header">
          <h1>My Data</h1>
        </div>
        <div className="tables-group">
          <p className="sidebar-title">Custom</p>
          <div className="tables-list">
            <PlatformMenu platforms={customPlatforms} baseHref={baseHref} />
            <AddDataSetModal orgId={orgId}>
              <CirclePlus size={16} aria-hidden="true" />
              Add New Data Set
            </AddDataSetModal>
          </div>
        </div>
        <div className="tables-group">
          <p className="sidebar-title">Integrations</p>
          <div className="tables-list">
            <PlatformMenu platforms={integrationPlatforms} baseHref={baseHref} />
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
            <AddRecordModal
              orgId={orgId}
              fixedPlatformId={selectedPlatformId}
              onCreated={() => setRefreshKey((prev) => prev + 1)}
            />
          </div>
          <div className="toolbar-group is-right">
            <span className="toolbar-meta">
              {loading ? "Loading..." : `${entries.length} rows`}
            </span>
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
                  <td>{new Date(entry.date).toISOString()}</td>
                  <td>{entry.amountCents}</td>
                  <td>{entry.currency}</td>
                  <td>{entry.source}</td>
                  <td>{entry.notes ?? ""}</td>
                  <td className="mono">{entry.createdByUserId ?? ""}</td>
                  <td>{new Date(entry.createdAt).toISOString()}</td>
                  <td>{new Date(entry.updatedAt).toISOString()}</td>
                </tr>
              ))}
              {!loading && entries.length === 0 && (
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
    </>
  );
}
