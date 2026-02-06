"use client";

import { useEffect, useRef, useState } from "react";

type MembershipItem = {
  id: string;
  name: string;
  isCurrent: boolean;
};

export default function OrgDropdown({
  currentOrgName,
  memberships,
}: {
  currentOrgName: string;
  memberships: MembershipItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      className={`org-dropdown ${isOpen ? "is-open" : ""}`}
      ref={rootRef}
    >
      <button
        className="org-trigger"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="org-name">{currentOrgName}</span>
        <span className="org-caret">▾</span>
      </button>
      <div className="org-menu" role="menu">
        {memberships.map((membership) => (
          <button
            className={`org-item ${membership.isCurrent ? "is-current" : ""}`}
            key={membership.id}
            type="button"
            role="menuitem"
          >
            <span className="org-check">✓</span>
            {membership.name}
          </button>
        ))}
        {memberships.length === 0 && (
          <div className="org-item is-empty">No organizations yet</div>
        )}
        <div className="org-divider" />
        <button className="org-item" type="button" role="menuitem">
          <span className="org-plus">＋</span>
          Create Workspace
        </button>
      </div>
    </div>
  );
}
