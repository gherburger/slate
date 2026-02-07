"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const platformOptions = [
  "Google Ads",
  "Facebook Ads",
  "LinkedIn Ads",
  "New Platform 1",
  "New Platform 2",
];

export default function AddRecordModal() {
  const [open, setOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <>
      <button className="primary-pill" onClick={() => setOpen(true)}>
        + Add record
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
                <h2>Add record</h2>
                <p>
                  Entering many records? <span>Use bulk entry →</span>
                </p>
              </div>
              <div className="modal-grid">
                <label className="field">
                  <span>Date</span>
                  <input type="text" placeholder="04/24/2024" />
                </label>
                <label className="field">
                  <span>Spend</span>
                  <div className="currency-input">
                    <span className="currency-symbol">$</span>
                    <input type="text" placeholder="0.00" />
                  </div>
                </label>
                <div className="field full" ref={dropdownRef}>
                  <span>Platform</span>
                  <button
                    type="button"
                    className={`platform-trigger ${
                      platformOpen ? "is-open" : ""
                    }`}
                    onClick={() => setPlatformOpen((prev) => !prev)}
                  >
                    Select platform
                    <span className="caret">▾</span>
                  </button>
                  {platformOpen && (
                    <div className="platform-menu">
                      {platformOptions.map((option) => (
                        <button key={option} type="button">
                          {option}
                        </button>
                      ))}
                      <div className="platform-divider" />
                      <button className="add-platform" type="button">
                        + Add new platform
                      </button>
                    </div>
                  )}
                </div>
              </div>
            <div className="modal-actions">
              <button className="btn-secondary" disabled={isSubmitting}>
                Save & add another
              </button>
              <button
                className="btn-primary"
                disabled={isSubmitting}
                onClick={() => {
                  if (isSubmitting) return;
                  setIsSubmitting(true);
                  setTimeout(() => setIsSubmitting(false), 800);
                }}
              >
                Save record <span className="arrow">→</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
