"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, CircleAlert, CloudUpload, TriangleAlert, Upload, X } from "lucide-react";
import {
  parseBulkRow,
  parseBulkPaste,
  type ParsedBulkRow,
} from "@/app/(app)/org/[orgId]/mydata/bulk-entry-utils";

type BulkEntryModalProps = {
  orgId: string;
  platformId: string | null;
  open: boolean;
  initialStep?: "paste" | "upload";
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

type Step = "paste" | "upload" | "review";
type EditableField = "rawDate" | "rawSpend";
type EditingCell = { rowIndex: number; field: EditableField } | null;
type ImportSource = "PASTE" | "UPLOAD";

export default function BulkEntryModal({
  orgId,
  platformId,
  open,
  initialStep = "paste",
  onOpenChange,
  onCreated,
}: BulkEntryModalProps) {
  const pasteZoneRef = useRef<HTMLDivElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("paste");
  const [pasteValue, setPasteValue] = useState("");
  const [pasteRows, setPasteRows] = useState<ParsedBulkRow[]>([]);
  const [rows, setRows] = useState<ParsedBulkRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const [importSource, setImportSource] = useState<ImportSource>("PASTE");
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editingValue, setEditingValue] = useState("");

  const resetState = () => {
    setStep("paste");
    setPasteValue("");
    setPasteRows([]);
    setRows([]);
    setIsParsing(false);
    setIsSubmitting(false);
    setIsReadingFile(false);
    setSelectedUploadFile(null);
    setIsDragOverUpload(false);
    setImportSource("PASTE");
    setEditingCell(null);
    setEditingValue("");
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

  useEffect(() => {
    if (!open || step !== "paste") return;
    const frame = requestAnimationFrame(() => {
      pasteZoneRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    setStep(initialStep);
  }, [open, initialStep]);

  const liveRows = useMemo(() => parseBulkPaste(pasteValue).rows, [pasteValue]);
  const displayRows = step === "review" ? rows : pasteRows;
  const hasPasteData = pasteValue.trim().length > 0 || pasteRows.length > 0;

  useEffect(() => {
    setPasteRows(liveRows);
    setEditingCell(null);
    setEditingValue("");
  }, [liveRows]);

  const invalidCount = useMemo(
    () => displayRows.filter((row) => row.error !== null).length,
    [displayRows],
  );
  const invalidDateCount = useMemo(
    () =>
      displayRows.filter(
        (row) =>
          row.error &&
          (row.error.includes("Date") ||
            row.error.includes("Month") ||
            row.error.includes("day")),
      ).length,
    [displayRows],
  );
  const invalidSpendCount = useMemo(
    () =>
      displayRows.filter(
        (row) => row.error && row.error.toLowerCase().includes("spend"),
      ).length,
    [displayRows],
  );
  const validRows = useMemo(
    () =>
      displayRows
        .filter((row) => row.error === null && row.date && row.amountCents !== null)
        .map((row) => ({ date: row.date as string, amountCents: row.amountCents as number })),
    [displayRows],
  );

  const sampleData = "Date,Spend\n01/02/2024,23423.00\n01/01/2024,234.00\n12/31/2023,39.00";

  async function handleCsvFile(file: File) {
    if (isReadingFile) return;
    setIsReadingFile(true);
    setError(null);

    try {
      const text = await file.text();
      const parsed = parseBulkPaste(text).rows;
      if (parsed.length === 0) {
        setError("No rows found in file. Expected Date and Spend columns.");
        return;
      }
      setPasteValue(text);
      setPasteRows(parsed);
      setRows(parsed);
      setImportSource("UPLOAD");
      setStep("review");
      setSelectedUploadFile(null);
    } catch {
      setError("Unable to read that CSV file.");
    } finally {
      setIsReadingFile(false);
    }
  }

  function onChooseUploadFile(file: File | null) {
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".tsv") && file.type !== "text/plain") {
      setError("Select a CSV or TSV file.");
      return;
    }
    setSelectedUploadFile(file);
    setError(null);
  }

  async function handleUploadSelectedFile() {
    if (!selectedUploadFile) return;
    await handleCsvFile(selectedUploadFile);
  }

  function formatDateInput(value: string) {
    const raw = value.replace(/[^0-9/]/g, "");
    const endsWithSlash = raw.endsWith("/");
    const parts = raw.split("/");
    let mmPart = (parts[0] ?? "").replace(/\D/g, "");
    let ddPart = (parts[1] ?? "").replace(/\D/g, "");
    const yyyyPart = (parts[2] ?? "").replace(/\D/g, "");

    if (endsWithSlash) {
      if (mmPart.length === 1 && parts.length >= 2 && ddPart.length === 0) {
        mmPart = `0${mmPart}`;
      }
      if (parts.length >= 2 && ddPart.length === 1) {
        ddPart = `0${ddPart}`;
      }
    }

    let digits = `${mmPart}${ddPart}${yyyyPart}`;
    if (digits.length > 8) digits = digits.slice(0, 8);

    const mm = digits.slice(0, 2);
    const dd = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);

    if (!mm) return "";

    let formatted = mm;
    if (digits.length >= 2) formatted += "/";
    if (digits.length > 2) formatted += dd;
    if (digits.length >= 4) formatted += "/";
    if (digits.length > 4) formatted += yyyy;

    return formatted.slice(0, 10);
  }

  const handleContinue = useCallback(async () => {
    if (isParsing) return;
    if (!hasPasteData) return;

    setIsParsing(true);
    setError(null);
    try {
      if (pasteRows.length === 0) {
        setError("No rows found. Paste CSV or TSV with Date and Spend columns.");
        return;
      }

      setRows(pasteRows);
      setStep("review");
    } finally {
      setIsParsing(false);
    }
  }, [hasPasteData, isParsing, pasteRows]);

  useEffect(() => {
    if (!open || step !== "paste") return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter") return;
      if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
      if (editingCell) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        tag === "BUTTON" ||
        tag === "A"
      ) {
        return;
      }

      if (!hasPasteData || isParsing) return;
      event.preventDefault();
      void handleContinue();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, step, editingCell, hasPasteData, isParsing, handleContinue]);

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const pastedText = event.clipboardData.getData("text");
    if (!pastedText.trim()) return;
    event.preventDefault();
    setPasteValue(pastedText);
    setImportSource("PASTE");
    setError(null);
  }

  function startEditCell(rowIndex: number, field: EditableField) {
    if (step !== "paste") return;
    const row = pasteRows[rowIndex];
    if (!row) return;
    const nextValue = field === "rawDate" ? (row.date ?? row.rawDate) : row.rawSpend;
    setEditingCell({ rowIndex, field });
    setEditingValue(nextValue);
  }

  function updateCellValue(rowIndex: number, field: EditableField, nextValue: string) {
    setPasteRows((current) => {
      const row = current[rowIndex];
      if (!row) return current;

      const nextRawDate =
        field === "rawDate" ? formatDateInput(nextValue).trim() : row.rawDate;
      const nextRawSpend =
        field === "rawSpend" ? nextValue.trim() : row.rawSpend;
      const updated = parseBulkRow(row.rowNumber, nextRawDate, nextRawSpend);

      return current.map((entry, index) => (index === rowIndex ? updated : entry));
    });
  }

  function commitCellEdit(nextValue?: string) {
    if (!editingCell) return;
    const value = typeof nextValue === "string" ? nextValue : editingValue;
    const normalizedValue =
      editingCell.field === "rawDate" ? formatDateInput(value) : value;
    updateCellValue(
      editingCell.rowIndex,
      editingCell.field,
      normalizedValue,
    );
    setEditingCell(null);
    setEditingValue("");
  }

  function handleClearPaste() {
    setPasteValue("");
    setPasteRows([]);
    setImportSource("PASTE");
    setEditingCell(null);
    setEditingValue("");
    setError(null);
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
          importSource,
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
          <h2>{step === "upload" ? "Upload CSV/TSV" : "Bulk Record Entry"}</h2>
          <p>
            {step === "upload"
              ? ""
              : step === "review"
              ? invalidCount > 0
                ? `Review ${invalidCount} ${invalidCount === 1 ? "row" : "rows"} below`
                : "Everything look good?"
              : "Paste your data below or upload a CSV file"}
          </p>
        </div>
        <div className="bulk-section-divider" />

        {step === "paste" ? (
          <>
            <div className="bulk-import-toolbar">
              <button
                type="button"
                className="bulk-upload-btn"
                onClick={() => {
                  setStep("upload");
                  setError(null);
                }}
              >
                <Upload size={20} />
                <span>Upload CSV</span>
              </button>
              <button
                type="button"
                className="bulk-example-link"
                onClick={() => {
                  setPasteValue(sampleData);
                  setImportSource("PASTE");
                  setError(null);
                }}
              >
                See example
              </button>
            </div>

            <div className="bulk-sheet-card">
              <div className="bulk-sheet-head">
                <span>Date</span>
                <span>Spend</span>
              </div>
              <div
                className="bulk-grid-wrap bulk-grid-wrap-preview"
                role="region"
                aria-label="Paste data to preview parsed rows"
                tabIndex={0}
                ref={pasteZoneRef}
                onPaste={handlePaste}
              >
                <table className="bulk-grid">
                  <tbody>
                    {displayRows.length > 0 ? (
                      displayRows.map((row, index) => (
                        <tr key={`${row.rowNumber}-${index}`} className={row.error ? "is-invalid" : "is-valid"}>
                          <td
                            className={`bulk-cell-editable ${
                              editingCell?.rowIndex === index &&
                              editingCell.field === "rawDate"
                                ? "is-editing"
                                : ""
                            }`}
                            onClick={() => startEditCell(index, "rawDate")}
                          >
                            <input
                              className="bulk-cell-input"
                              value={
                                editingCell?.rowIndex === index &&
                                editingCell.field === "rawDate"
                                  ? editingValue
                                  : row.date ?? row.rawDate
                              }
                              onFocus={() => startEditCell(index, "rawDate")}
                              onChange={(event) => {
                                const formattedDate = formatDateInput(event.target.value);
                                if (
                                  editingCell?.rowIndex === index &&
                                  editingCell.field === "rawDate"
                                ) {
                                  setEditingValue(formattedDate);
                                  updateCellValue(index, "rawDate", formattedDate);
                                  return;
                                }
                                setEditingCell({ rowIndex: index, field: "rawDate" });
                                setEditingValue(formattedDate);
                                updateCellValue(index, "rawDate", formattedDate);
                              }}
                              onBlur={commitCellEdit}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  commitCellEdit(formatDateInput(event.currentTarget.value));
                                  event.currentTarget.blur();
                                }
                                if (event.key === "Escape") {
                                  event.preventDefault();
                                  setEditingCell(null);
                                  setEditingValue("");
                                }
                              }}
                            />
                          </td>
                          <td
                            className={`bulk-cell-editable ${
                              editingCell?.rowIndex === index &&
                              editingCell.field === "rawSpend"
                                ? "is-editing"
                                : ""
                            }`}
                            onClick={() => startEditCell(index, "rawSpend")}
                          >
                            <input
                              className="bulk-cell-input"
                              value={
                                editingCell?.rowIndex === index &&
                                editingCell.field === "rawSpend"
                                  ? editingValue
                                  : row.rawSpend
                              }
                              onFocus={() => startEditCell(index, "rawSpend")}
                              onChange={(event) => {
                                if (
                                  editingCell?.rowIndex === index &&
                                  editingCell.field === "rawSpend"
                                ) {
                                  setEditingValue(event.target.value);
                                  updateCellValue(index, "rawSpend", event.target.value);
                                  return;
                                }
                                setEditingCell({ rowIndex: index, field: "rawSpend" });
                                setEditingValue(event.target.value);
                                updateCellValue(index, "rawSpend", event.target.value);
                              }}
                              onBlur={commitCellEdit}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  commitCellEdit(event.currentTarget.value);
                                  event.currentTarget.blur();
                                }
                                if (event.key === "Escape") {
                                  event.preventDefault();
                                  setEditingCell(null);
                                  setEditingValue("");
                                }
                              }}
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="is-empty">
                        <td colSpan={2} className="bulk-empty-state">
                          Paste CSV/TSV here (Cmd/Ctrl+V)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bulk-parse-summary">
              <div className="bulk-parse-summary-left">
                {invalidDateCount > 0 ? (
                  <div className="bulk-summary-item is-error">
                    <CircleAlert size={18} />
                    <span>{invalidDateCount} invalid date format</span>
                  </div>
                ) : null}

                {invalidSpendCount > 0 ? (
                  <div className="bulk-summary-item is-warning">
                    <TriangleAlert size={18} />
                    <span>{invalidSpendCount} spend value might be incorrect</span>
                    <button
                      type="button"
                      className="bulk-review-btn"
                      disabled={isParsing}
                      onClick={handleContinue}
                    >
                      Review
                    </button>
                  </div>
                ) : null}
              </div>

              {validRows.length > 0 ? (
                <div className="bulk-summary-item is-ok">
                  <CheckCircle2 size={18} />
                  <span>{validRows.length} rows ready to import</span>
                </div>
              ) : null}
            </div>

            {error && <div className="field-error bulk-field-error">{error}</div>}
            <div className="bulk-section-divider bulk-section-divider-footer" />
            <div className="modal-actions bulk-footer bulk-footer-preview">
              <div className="bulk-footer-left">
                <button className="btn-secondary" onClick={close}>
                  Cancel
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleClearPaste}
                  disabled={!hasPasteData}
                >
                  Clear
                </button>
              </div>
              <button
                className="btn-primary"
                disabled={!hasPasteData || isParsing}
                onClick={handleContinue}
              >
                {isParsing ? "Parsing..." : "Preview Import →"}
              </button>
            </div>
          </>
        ) : step === "upload" ? (
          <>
            <div className="bulk-upload-panel">
              <div
                className={`bulk-upload-dropzone ${isDragOverUpload ? "is-dragover" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOverUpload(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDragOverUpload(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOverUpload(false);
                  const file = event.dataTransfer.files?.[0] ?? null;
                  onChooseUploadFile(file);
                }}
              >
                <CloudUpload size={72} />
                <p>Drag your CSV/TSV file here to start uploading.</p>
                <div className="bulk-upload-or">OR</div>
                <button
                  type="button"
                  className="marketing-primary bulk-browse-btn"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  Browse files
                </button>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".csv,.tsv,text/csv,text/tab-separated-values,text/plain"
                  onChange={(event) => {
                    onChooseUploadFile(event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                  hidden
                />
              </div>

              {selectedUploadFile ? (
                <div className="bulk-upload-selected">
                  <button
                    type="button"
                    className="bulk-upload-remove"
                    aria-label="Remove selected file"
                    onClick={() => {
                      setSelectedUploadFile(null);
                      setError(null);
                    }}
                  >
                    <X size={16} />
                  </button>
                  <span className="bulk-upload-filename">{selectedUploadFile.name}</span>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      void handleUploadSelectedFile();
                    }}
                    disabled={isReadingFile}
                  >
                    {isReadingFile ? "Uploading..." : "Upload File"}
                  </button>
                </div>
              ) : null}
            </div>

            {error && <div className="field-error bulk-field-error">{error}</div>}
            <div className="bulk-section-divider bulk-section-divider-footer" />
            <div className="modal-actions bulk-footer bulk-footer-upload">
              <button
                className="btn-secondary"
                onClick={() => {
                  setStep("paste");
                  setError(null);
                }}
              >
                Back
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bulk-sheet-card">
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
                        <td>{row.rawSpend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {error && <div className="field-error bulk-field-error">{error}</div>}

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
