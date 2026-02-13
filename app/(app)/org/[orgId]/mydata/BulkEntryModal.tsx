"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  formatAmountFromCents,
  parseBulkPaste,
  type ParsedBulkRow,
} from "@/app/(app)/org/[orgId]/mydata/bulk-entry-utils";

type BulkEntryModalProps = {
  orgId: string;
  platformId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

type Step = "paste" | "review";

export default function BulkEntryModal({
  orgId,
  platformId,
  open,
  onOpenChange,
  onCreated,
}: BulkEntryModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("paste");
  const [pasteValue, setPasteValue] = useState("");
  const [rows, setRows] = useState<ParsedBulkRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setStep("paste");
    setPasteValue("");
    setRows([]);
    setIsParsing(false);
    setIsSubmitting(false);
    setError(null);
  };

  const close = () => {
    onOpenChange(false);
    resetState();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, mounted]);

  const hasPasteData = pasteValue.trim().length > 0;

  const invalidCount = useMemo(
    () => rows.filter((row) => row.error !== null).length,
    [rows],
  );
  const validRows = useMemo(
    () =>
      rows
        .filter((row) => row.error === null && row.date && row.amountCents !== null)
        .map((row) => ({ date: row.date as string, amountCents: row.amountCents as number })),
    [rows],
  );

  async function handleContinue() {
    if (isParsing) return;
    if (!hasPasteData) return;

    setIsParsing(true);
    setError(null);
    try {
      const parsed = parseBulkPaste(pasteValue);
      if (parsed.rows.length === 0) {
        setError("No rows found. Paste CSV or TSV with Date and Spend columns.");
        return;
      }

      setRows(parsed.rows);
      setStep("review");
    } finally {
      setIsParsing(false);
    }
  }

  async function handleConfirm() {
    if (isSubmitting) return;
    if (!platformId) {
      setError("Select a platform before bulk entry.");
      return;
    }
    if (invalidCount > 0 || validRows.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/spend/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          platformId,
          rows: validRows,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to add bulk rows");
      }

      close();
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add bulk rows");
      setIsSubmitting(false);
    }
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className="modal-overlay" onClick={close} role="presentation">
      <div
        className={`modal-card modal-card-bulk ${step === "review" ? "is-review" : "is-paste"}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className="modal-close" aria-label="Close" onClick={close}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <h2>Bulk Entry</h2>
          <p>Paste data directly from your spreadsheet below</p>
        </div>

        {step === "paste" ? (
          <>
            <div className="bulk-sheet-head">
              <span>Date</span>
              <span>Spend</span>
            </div>
            <div className="bulk-paste-wrap">
              <textarea
                className="bulk-paste-input"
                value={pasteValue}
                onChange={(event) => setPasteValue(event.target.value)}
                placeholder={"02/03/2024\t782.38\n02/03/2024\t782.38\n02/03/2024\t782.38"}
              />
            </div>
            {error && <div className="field-error">{error}</div>}
            <div className="modal-actions bulk-footer">
              <button
                className="btn-primary"
                disabled={!hasPasteData || isParsing}
                onClick={handleContinue}
              >
                {isParsing ? "Parsing..." : "Continue →"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bulk-sheet-head">
              <span>Date</span>
              <span>Spend</span>
            </div>
            <div className="bulk-grid-wrap" role="region" aria-label="Bulk review grid">
              <table className="bulk-grid">
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.rowNumber} className={row.error ? "is-invalid" : "is-valid"}>
                      <td>
                        <div>{row.date ?? row.rawDate}</div>
                        {row.error ? (
                          <div className="bulk-inline-error">Row {row.rowNumber}: {row.error}</div>
                        ) : null}
                      </td>
                      <td>
                        {row.amountCents !== null
                          ? formatAmountFromCents(row.amountCents)
                          : row.rawSpend}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && <div className="field-error">{error}</div>}

            <div className="modal-actions bulk-footer bulk-footer-review">
              <span className="bulk-rows-count">{rows.length} rows parsed</span>
              <button
                className="btn-secondary"
                disabled={isSubmitting}
                onClick={() => {
                  setStep("paste");
                  setError(null);
                }}
              >
                Back
              </button>
              <button
                className="btn-primary"
                disabled={isSubmitting || invalidCount > 0 || validRows.length === 0}
                onClick={handleConfirm}
              >
                {isSubmitting ? "Adding..." : "Confirm & Add"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
