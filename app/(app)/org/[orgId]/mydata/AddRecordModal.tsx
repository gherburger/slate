"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type PlatformOption = {
  id: string;
  name: string;
};

type AddRecordModalProps = {
  orgId: string;
  platforms?: PlatformOption[];
  fixedPlatformId?: string | null;
  onCreated?: () => void;
  onUseBulkEntry?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
};

export default function AddRecordModal({
  orgId,
  platforms = [],
  fixedPlatformId = null,
  onCreated,
  onUseBulkEntry,
  open: controlledOpen,
  onOpenChange,
  disabled = false,
}: AddRecordModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    if (controlledOpen === undefined) {
      setUncontrolledOpen(value);
    }
  };
  const [platformOpen, setPlatformOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resetState = () => {
    setPlatformOpen(false);
    setDateValue("");
    setAmountValue("");
    setDateTouched(false);
    setAmountTouched(false);
    setError(null);
    setOverwritePrompt(null);
    setOverwriteText("");
  };
  const handleClose = () => {
    setOpen(false);
    resetState();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (overwritePrompt) {
      confirmOverwrite();
    } else {
      submitRecord(true);
    }
  };
  const [dateValue, setDateValue] = useState("");
  const [amountValue, setAmountValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [overwritePrompt, setOverwritePrompt] = useState<{
    date: string;
    newAmountCents: number;
    displayAmount: string;
    existingAmountCents: number | null;
  } | null>(null);
  const [overwriteText, setOverwriteText] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(
    fixedPlatformId ?? platforms[0]?.id ?? null
  );
  const [dateTouched, setDateTouched] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);

  useEffect(() => {
    if (fixedPlatformId) {
      setSelectedPlatformId(fixedPlatformId);
    }
  }, [fixedPlatformId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setPlatformOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    if (!open || !mounted || overwritePrompt) return;
    const handle = window.requestAnimationFrame(() => {
      dateInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(handle);
  }, [open, mounted, overwritePrompt]);

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

  function formatAmountInput(value: string) {
    let raw = value.replace(/[^0-9.,]/g, "");
    const parts = raw.split(".");
    if (parts.length > 1) {
      raw = `${parts[0]}.${parts.slice(1).join("")}`;
    }
    return raw;
  }

  async function submitRecord(closeOnSuccess: boolean) {
    if (isSubmitting) return;
    const date = dateValue.trim();
    const amount = amountValue.trim();
    const platformId = selectedPlatformId;

    if (!platformId) {
      setError("Select a platform.");
      return;
    }

    if (!date || !/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      setError("Enter a valid date (MM/DD/YYYY).");
      return;
    }

    const [mm, dd, yyyy] = date.split("/").map((part) => Number(part));
    if (mm < 1 || mm > 12) {
      setError("Month must be between 01 and 12.");
      return;
    }
    const maxDay = new Date(yyyy, mm, 0).getDate();
    if (dd < 1 || dd > maxDay) {
      setError("Day is not valid for the selected month.");
      return;
    }

    const entryDate = new Date(yyyy, mm - 1, dd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    entryDate.setHours(0, 0, 0, 0);
    if (entryDate > today) {
      setError("That date hasn't happened yet! Do you want to forecast future spend?");
      return;
    }

    if (!/^[0-9.,]+$/.test(amount)) {
      setError("Enter a valid amount.");
      return;
    }

    const amountNumber = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(amountNumber)) {
      setError("Enter a valid amount.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          platformId,
          date,
          amountCents: Math.round(amountNumber * 100),
        }),
      });

      if (!res.ok) {
        if (res.status === 409) {
          const data = await res.json();
          if (data.error === "DUPLICATE_SAME") {
            setError(
              `${amountNumber} already exists for ${date}.`
            );
            return;
          }
          if (data.error === "DUPLICATE_DIFFERENT") {
            const existingAmountCents =
              typeof data.existingAmountCents === "number"
                ? data.existingAmountCents
                : null;
            setOverwritePrompt({
              date,
              newAmountCents: Math.round(amountNumber * 100),
              displayAmount:
                existingAmountCents === null
                  ? new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 2,
                    }).format(amountNumber)
                  : new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 2,
                    }).format(existingAmountCents / 100),
              existingAmountCents,
            });
            return;
          }
        }
        const message = await res.text();
        throw new Error(message || "Failed to create spend entry.");
      }

      if (closeOnSuccess) {
        setOpen(false);
        resetState();
      } else {
        setDateValue("");
        setAmountValue("");
        setError(null);
      }
      onCreated?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create spend entry."
      );
    } finally {
      setTimeout(() => setIsSubmitting(false), 800);
    }
  }

  const showPlatformSelector = !fixedPlatformId;
  const selectedPlatform = platforms.find(
    (platform) => platform.id === selectedPlatformId
  );

  const isDateFormatValid = /^\d{2}\/\d{2}\/\d{4}$/.test(dateValue);
  let isDateValueValid = false;
  if (isDateFormatValid) {
    const [mm, dd, yyyy] = dateValue.split("/").map((part) => Number(part));
    if (mm >= 1 && mm <= 12) {
      const maxDay = new Date(yyyy, mm, 0).getDate();
      isDateValueValid = dd >= 1 && dd <= maxDay;
    }
  }
  const showDateError = dateTouched && dateValue.length > 0 && !isDateValueValid;

  const isAmountValueValid =
    amountValue.length === 0
      ? false
      : /^[0-9.,]+$/.test(amountValue) &&
        Number.isFinite(Number(amountValue.replace(/,/g, "")));
  const showAmountError =
    amountTouched && amountValue.length > 0 && !isAmountValueValid;

  async function confirmOverwrite() {
    if (!overwritePrompt || isSubmitting) return;
    if (overwriteText.trim().toLowerCase() !== "overwrite") {
      setError('Type "overwrite" to confirm.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/spend/overwrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          platformId: selectedPlatformId,
          date: overwritePrompt.date,
          amountCents: overwritePrompt.newAmountCents,
          confirm: "overwrite",
        }),
      });

      if (!res.ok) {
        const message = await res.text();
        if (message === "DUPLICATE_SAME") {
          setError(
            `${overwritePrompt.displayAmount} already exists for ${overwritePrompt.date}.`
          );
          return;
        }
        throw new Error(message || "Failed to overwrite.");
      }

      setOverwritePrompt(null);
      setOverwriteText("");
      setOpen(false);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to overwrite.");
    } finally {
      setTimeout(() => setIsSubmitting(false), 800);
    }
  }

  return (
    <>
      <button
        className="primary-pill"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        + Add record
      </button>
      {open &&
        mounted &&
        createPortal(
          <div className="modal-overlay" onClick={handleClose} role="presentation">
            <div
              className="modal-card"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={handleKeyDown}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
            >
              <button
                className="modal-close"
                aria-label="Close"
                onClick={handleClose}
              >
                <X size={20} />
              </button>
              {overwritePrompt ? (
                <>
                  <div className="modal-header">
                    <h2>Overwrite Data?</h2>
                    <p>
                      Value {overwritePrompt.displayAmount} already exists for{" "}
                      {overwritePrompt.date}. Are you sure you want to
                      continue?
                    </p>
                  </div>
                  <div className="modal-grid">
                    <label className="field full">
                      <span>Type “overwrite” to confirm this change</span>
                      <input
                        type="text"
                        value={overwriteText}
                        onChange={(event) => setOverwriteText(event.target.value)}
                      />
                    </label>
                  </div>
                  {error && <div className="field-error">{error}</div>}
                  <div className="modal-actions">
                    <button
                      className="btn-primary"
                      disabled={isSubmitting}
                      onClick={confirmOverwrite}
                    >
                      Confirm
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="modal-header">
                    <h2>Add record</h2>
                    <p>
                      Entering many records?{" "}
                      {onUseBulkEntry ? (
                        <button
                          type="button"
                          className="modal-inline-link"
                          onClick={() => {
                            handleClose();
                            onUseBulkEntry();
                          }}
                        >
                          Use bulk entry →
                        </button>
                      ) : (
                        <span className="modal-inline-link modal-inline-link-static">
                          Use bulk entry →
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="modal-grid">
                    <label className="field">
                      <span>Date</span>
                      <input
                        ref={dateInputRef}
                        type="text"
                        placeholder="04/24/2024"
                        value={dateValue}
                        onChange={(event) => {
                          setDateValue(formatDateInput(event.target.value));
                          if (!dateTouched) setDateTouched(true);
                        }}
                        className={showDateError ? "input-error" : undefined}
                        inputMode="numeric"
                      />
                    </label>
                    <label className="field">
                      <span>Spend</span>
                      <div className="currency-input">
                        <span className="currency-symbol">$</span>
                        <input
                          type="text"
                          placeholder="0.00"
                          value={amountValue}
                          onChange={(event) => {
                            setAmountValue(formatAmountInput(event.target.value));
                            if (!amountTouched) setAmountTouched(true);
                          }}
                          className={showAmountError ? "input-error" : undefined}
                          inputMode="decimal"
                        />
                      </div>
                    </label>
                    {showPlatformSelector && (
                      <div className="field full" ref={dropdownRef}>
                        <span>Platform</span>
                        <button
                          type="button"
                          className={`platform-trigger ${
                            platformOpen ? "is-open" : ""
                          }`}
                          onClick={() => setPlatformOpen((prev) => !prev)}
                        >
                          {selectedPlatform?.name ?? "Select platform"}
                          <span className="caret">▾</span>
                        </button>
                        {platformOpen && (
                          <div className="platform-menu">
                            {platforms.map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPlatformId(option.id);
                                  setPlatformOpen(false);
                                }}
                              >
                                {option.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {error && <div className="field-error">{error}</div>}
                  <div className="modal-actions">
                    <button
                      className="btn-secondary"
                      disabled={isSubmitting}
                      onClick={() => submitRecord(false)}
                    >
                      Save & add another
                    </button>
                    <button
                      className="btn-primary"
                      disabled={isSubmitting}
                      onClick={() => submitRecord(true)}
                    >
                      Save record <span className="arrow">→</span>
                    </button>
                  </div>
                </>
              )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
