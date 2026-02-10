"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type AddDataSetModalProps = {
  orgId: string;
  children: React.ReactNode;
};

export default function AddDataSetModal({
  orgId,
  children,
}: AddDataSetModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

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

  async function handleSubmit() {
    if (isSubmitting) return;
    const normalized = name.trim().toLowerCase();
    const isValid = /^[a-z0-9_-]+$/.test(normalized);
    if (!normalized || !isValid) {
      setError("Only letters, numbers, '_' or '-' are allowed.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalized, orgId }),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to create data set.");
      }

      setOpen(false);
      setName("");
      router.refresh();
    } catch (err) {
      const raw =
        err instanceof Error ? err.message : "Failed to create data set.";
      const friendly =
        raw === "Name conflicts with a global platform"
          ? "That name is reserved by a global platform."
          : raw;
      setError(friendly);
    } finally {
      setTimeout(() => setIsSubmitting(false), 800);
    }
  }

  return (
    <>
      <button
        type="button"
        className="tables-item tables-item-add"
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      {open &&
        mounted &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setOpen(false)}
            role="presentation"
          >
            <div
              className="modal-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <button
                className="modal-close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
              <div className="modal-header">
                <h2>Add New Data Set</h2>
              </div>
              <div className="modal-grid">
                <label className="field full">
                  <span>Name your data set</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. podcast_sponsorships"
                  />
                  <span className="field-note">
                    Only letters, numbers, "_" or "-" characters.
                  </span>
                </label>
              </div>
              {error && <div className="field-error">{error}</div>}
              <div className="modal-actions">
                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  Create
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
