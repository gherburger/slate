"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";

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
  const [error, setError] = useState<{
    type: "global" | "generic";
    message: string;
    name?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleSubmit();
  };

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
    const trimmed = name.trim();
    const isValid = /^[a-zA-Z0-9 _\-()]+$/.test(trimmed);
    if (!trimmed || !isValid) {
      setError({
        type: "generic",
        message: "Only letters, numbers, spaces, '_', '-' or parentheses are allowed.",
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, orgId }),
      });

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("ALREADY_EXISTS");
        }
        const message = await res.text();
        throw new Error(message || "Failed to create data set.");
      }

      setOpen(false);
      setName("");
      router.refresh();
    } catch (err) {
      const raw =
        err instanceof Error ? err.message : "Failed to create data set.";
      const displayName = name.trim();
      setError({
        type: "generic",
        message:
          raw === "ALREADY_EXISTS"
            ? `${displayName} already exists.`
            : raw,
      });
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
              onKeyDown={handleKeyDown}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
            >
              <button
                className="modal-close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
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
                    Only letters, numbers, spaces, "_" , "-" or parentheses.
                  </span>
                </label>
              </div>
              {error && (
                <div className="field-error">
                  {error.type === "global" ? (
                    <>
                      {error.message}{" "}
                      <Link className="field-error-link" href="/connections">
                        Click here to add the {error.name} app →
                      </Link>
                    </>
                  ) : (
                    error.message
                  )}
                </div>
              )}
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
