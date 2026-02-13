"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AddRecordModal from "@/app/(app)/org/[orgId]/mydata/AddRecordModal";
import BulkEntryModal from "@/app/(app)/org/[orgId]/mydata/BulkEntryModal";
import AddDataSetModal from "@/app/(app)/org/[orgId]/mydata/AddDataSetModal";
import PlatformMenu from "@/app/(app)/org/[orgId]/mydata/PlatformMenu";
import {
  CirclePlus,
  Download,
  ExternalLink,
  MoreHorizontal,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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
  isInternal,
}: {
  orgId: string;
  customPlatforms: PlatformItem[];
  integrationPlatforms: PlatformItem[];
  isInternal: boolean;
}) {
  const searchParams = useSearchParams();
  const queryPlatformId = searchParams.get("platformId");
  const defaultPlatformId =
    customPlatforms[0]?.id ?? integrationPlatforms[0]?.id ?? null;
  const selectedPlatformId = queryPlatformId ?? defaultPlatformId;

  const [entries, setEntries] = useState<SpendEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkInitialStep, setBulkInitialStep] = useState<"paste" | "upload">("paste");
  const [isExportingSheets, setIsExportingSheets] = useState(false);

  const internalOnlyColumns = useMemo(
    () =>
      new Set([
        "id",
        "orgId",
        "source",
        "createdByUserId",
        "Created",
        "Updated",
        "platformId",
      ]),
    []
  );

  const allColumnLabels = useMemo(
    () => [
      { key: "id", label: "id" },
      { key: "orgId", label: "orgId" },
      { key: "platformId", label: "platformId" },
      { key: "Date", label: "Date" },
      { key: "Spend", label: "Spend" },
      { key: "currency", label: "currency" },
      { key: "source", label: "source" },
      { key: "notes", label: "notes" },
      { key: "createdByUserId", label: "createdByUserId" },
      { key: "Created", label: "Created" },
      { key: "Updated", label: "Updated" },
    ],
    []
  );

  const columnLabels = useMemo(
    () =>
      isInternal
        ? allColumnLabels
        : allColumnLabels.filter((col) => !internalOnlyColumns.has(col.key)),
    [allColumnLabels, internalOnlyColumns, isInternal]
  );

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    () =>
      allColumnLabels.reduce<Record<string, boolean>>((acc, col) => {
        acc[col.key] = isInternal || !internalOnlyColumns.has(col.key);
        return acc;
      }, {})
  );

  const allPlatforms = useMemo(
    () => [...customPlatforms, ...integrationPlatforms],
    [customPlatforms, integrationPlatforms]
  );

  function downloadCsv() {
    if (!selectedPlatformId) return;
    const headers = visibleHeaderKeys.map((col) => col.label);
    const rows = entries.map((entry) =>
      visibleHeaderKeys.map((col) => {
        switch (col.key) {
          case "id":
            return entry.id;
          case "orgId":
            return entry.orgId;
          case "platformId":
            return entry.platformId;
          case "Date":
            return new Date(entry.date).toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            });
          case "Spend":
            return new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
            }).format(entry.amountCents / 100);
          case "currency":
            return entry.currency;
          case "source":
            return entry.source;
          case "notes":
            return entry.notes ?? "";
          case "createdByUserId":
            return entry.createdByUserId ?? "";
          case "Created":
            return new Date(entry.createdAt).toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            });
          case "Updated":
            return new Date(entry.updatedAt).toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            });
          default:
            return "";
        }
      })
    );
    const escapeCell = (value: string | number) => {
      const text = String(value ?? "");
      if (text.includes('"') || text.includes(",") || text.includes("\n")) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const selectedName =
      allPlatforms.find((p) => p.id === selectedPlatformId)?.name ?? "dataset";
    link.href = url;
    link.download = `${selectedName}-data.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function exportToSheets() {
    if (!selectedPlatformId) return;
    setIsExportingSheets(true);

    try {
      const response = await fetch("/api/integrations/google-sheets/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          platformId: selectedPlatformId,
          visibleColumnKeys: visibleHeaderKeys.map((column) => column.key),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (
          response.status === 409 &&
          (payload?.error === "GOOGLE_SHEETS_NOT_CONNECTED" ||
            payload?.error === "GOOGLE_SHEETS_RECONNECT_REQUIRED")
        ) {
          window.location.assign(
            `/org/${orgId}/integrations?connect=google_sheets&from=mydata`,
          );
          return;
        }

        throw new Error(payload?.error ?? "Failed to export to Google Sheets");
      }

      if (payload?.spreadsheetUrl) {
        const tab = window.open(payload.spreadsheetUrl, "_blank", "noopener,noreferrer");
        if (!tab) {
          window.location.assign(payload.spreadsheetUrl);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsExportingSheets(false);
    }
  }

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!columnsRef.current) return;
      if (!columnsRef.current.contains(event.target as Node)) {
        setColumnsOpen(false);
      }
    }

    if (columnsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [columnsOpen]);

  const baseHref = `/org/${orgId}/mydata`;

  const visibleHeaderKeys = useMemo(
    () => columnLabels.filter((col) => visibleColumns[col.key]),
    [columnLabels, visibleColumns]
  );

  return (
    <>
      <aside className="tables-sidebar">
        <div className="tables-header page-header">
          <h1>My Data</h1>
        </div>
        <div className="tables-group">
          <p className="sidebar-title">Custom</p>
          <div className="tables-list">
            <PlatformMenu
              platforms={customPlatforms}
              baseHref={baseHref}
              orgId={orgId}
            />
            <AddDataSetModal orgId={orgId}>
              <CirclePlus size={16} aria-hidden="true" />
              Add New Data Set
            </AddDataSetModal>
          </div>
        </div>
        <div className="tables-group">
          <p className="sidebar-title">Integrations</p>
          <div className="tables-list">
            <PlatformMenu
              platforms={integrationPlatforms}
              baseHref={baseHref}
              orgId={orgId}
            />
            <Link
              href={`/org/${orgId}/integrations`}
              className="tables-item tables-item-add"
            >
              <CirclePlus size={16} aria-hidden="true" />
              Add New App
            </Link>
          </div>
        </div>
      </aside>
      <div className="tables-main">
        <div className={`tables-toolbar ${entries.length === 0 ? "is-disabled" : ""}`}>
          <div className="toolbar-group">
            <button className="ghost-pill" disabled={entries.length === 0}>
              Filters
            </button>
            <div className="toolbar-menu" ref={columnsRef}>
              <button
                className="ghost-pill columns-trigger"
                onClick={() => setColumnsOpen((prev) => !prev)}
                disabled={entries.length === 0}
              >
                Columns{" "}
                {columnsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {columnsOpen && entries.length > 0 && (
                <div className="menu-dropdown columns-dropdown">
                  {columnLabels.map((col) => {
                    const isVisible = visibleColumns[col.key];
                    const Icon = isVisible ? Eye : EyeOff;
                    return (
                      <button
                        key={col.key}
                        type="button"
                        className={`column-item ${
                          isVisible ? "is-visible" : "is-hidden"
                        }`}
                        onClick={() => {
                          if (isVisible) {
                            const visibleCount = columnLabels.filter(
                              (colItem) => visibleColumns[colItem.key]
                            ).length;
                            if (visibleCount <= 1) return;
                          }
                          setVisibleColumns((prev) => ({
                            ...prev,
                            [col.key]: !prev[col.key],
                          }));
                        }}
                      >
                        <Icon size={18} />
                        <span>{col.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <AddRecordModal
              orgId={orgId}
              fixedPlatformId={selectedPlatformId}
              onCreated={() => setRefreshKey((prev) => prev + 1)}
              onUseBulkEntry={() => {
                setAddOpen(false);
                setBulkInitialStep("paste");
                setBulkOpen(true);
              }}
              open={addOpen}
              onOpenChange={setAddOpen}
              disabled={false}
            />
            <button
              className="primary-pill"
              onClick={() => {
                setBulkInitialStep("paste");
                setBulkOpen(true);
              }}
              disabled={!selectedPlatformId}
            >
              Bulk Entry
            </button>
            <BulkEntryModal
              orgId={orgId}
              platformId={selectedPlatformId}
              open={bulkOpen}
              initialStep={bulkInitialStep}
              onOpenChange={setBulkOpen}
              onCreated={() => setRefreshKey((prev) => prev + 1)}
            />
          </div>
          <div className="toolbar-group is-right">
            <span className="toolbar-meta">
              {loading ? "Loading..." : `${entries.length} rows`}
            </span>
            <button
              className="ghost-pill toolbar-action-btn download-button"
              onClick={downloadCsv}
              disabled={entries.length === 0}
            >
              Download <Download size={14} />
            </button>
            <button
              className="ghost-pill toolbar-action-btn sheets-button"
              disabled={entries.length === 0 || isExportingSheets}
              onClick={exportToSheets}
            >
              {isExportingSheets ? "Exporting..." : "Export to Sheets"}{" "}
              <ExternalLink size={14} />
            </button>
            <div className="toolbar-menu" ref={menuRef}>
              <button
                className="ghost-pill toolbar-action-btn menu-button"
                onClick={() => setMenuOpen((prev) => !prev)}
                disabled={entries.length === 0}
                aria-label="More options"
              >
                <MoreHorizontal size={18} strokeWidth={2.2} aria-hidden />
              </button>
              {menuOpen && entries.length > 0 && (
                <div className="menu-dropdown">
                  <button type="button">Share</button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setAddOpen(true);
                    }}
                  >
                    Add Record
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setBulkInitialStep("paste");
                      setBulkOpen(true);
                    }}
                  >
                    Bulk Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setBulkInitialStep("upload");
                      setBulkOpen(true);
                    }}
                  >
                    Upload CSV
                  </button>
                  <button type="button">Rename Data Set</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="tables-card">
          <table className={`data-table ${entries.length === 0 ? "is-empty" : ""}`}>
            {entries.length > 0 && (
              <thead>
                <tr>
                  {visibleColumns.id && <th>id</th>}
                  {visibleColumns.orgId && <th>orgId</th>}
                  {visibleColumns.platformId && <th>platformId</th>}
                  {visibleColumns.Date && <th>Date</th>}
                  {visibleColumns.Spend && <th>Spend</th>}
                  {visibleColumns.currency && <th>currency</th>}
                  {visibleColumns.source && <th>source</th>}
                  {visibleColumns.notes && <th>notes</th>}
                  {visibleColumns.createdByUserId && <th>createdByUserId</th>}
                  {visibleColumns.Created && <th>Created</th>}
                  {visibleColumns.Updated && <th>Updated</th>}
                </tr>
              </thead>
            )}
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  {visibleColumns.id && (
                    <td className="mono">{entry.id}</td>
                  )}
                  {visibleColumns.orgId && (
                    <td className="mono">{entry.orgId}</td>
                  )}
                  {visibleColumns.platformId && (
                    <td className="mono">{entry.platformId}</td>
                  )}
                  {visibleColumns.Date && (
                    <td>
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                  )}
                  {visibleColumns.Spend && (
                    <td>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                      }).format(entry.amountCents / 100)}
                    </td>
                  )}
                  {visibleColumns.currency && <td>{entry.currency}</td>}
                  {visibleColumns.source && <td>{entry.source}</td>}
                  {visibleColumns.notes && <td>{entry.notes ?? ""}</td>}
                  {visibleColumns.createdByUserId && (
                    <td className="mono">{entry.createdByUserId ?? ""}</td>
                  )}
                  {visibleColumns.Created && (
                    <td>
                      {new Date(entry.createdAt).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                  )}
                  {visibleColumns.Updated && (
                    <td>
                      {new Date(entry.updatedAt).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                  )}
                </tr>
              ))}
              {!loading && entries.length === 0 && (
                <tr>
                  <td colSpan={visibleHeaderKeys.length} className="empty-row">
                    No data yet.{" "}
                    <button
                      type="button"
                      className="link-button inline-link"
                      onClick={() => setAddOpen(true)}
                    >
                      Add a record
                    </button>{" "}
                    to get started.
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
