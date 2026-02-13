"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CircleCheck, X } from "lucide-react";

type PlatformItem = {
  id: string;
  name: string;
};

export default function PlatformMenu({
  platforms,
  baseHref,
  orgId,
}: {
  platforms: PlatformItem[];
  baseHref: string;
  orgId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("platformId");
  const [items, setItems] = useState(platforms);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    platform: PlatformItem;
    x: number;
    y: number;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingConfirmId, setPendingConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setItems(platforms);
  }, [platforms]);

  async function submitRename(platform: PlatformItem, name: string) {
    if (isSaving) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/platforms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: platform.id,
          orgId,
          name: trimmed,
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const updated: PlatformItem = await res.json();
      setItems((prev) =>
        prev.map((item) =>
          item.id === updated.id ? { ...item, name: updated.name } : item
        )
      );
      setEditingId(null);
      setPendingConfirmId(null);
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!contextMenu) return;
    function handleClick(event: MouseEvent) {
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }
      setContextMenu(null);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!editingId) return;
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (confirmRef.current && confirmRef.current.contains(target)) {
        return;
      }
      if (target && (target as HTMLElement).closest(".tables-item-input")) {
        return;
      }
      setEditingId(null);
      setPendingConfirmId(null);
    }

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [editingId]);

  return (
    <>
      {items.map((platform) => {
        const isActive = platform.id === activeId;
        const isContext = contextMenu?.platform.id === platform.id;
        const isEditing = editingId === platform.id;
        return (
          <button
            key={platform.id}
            type="button"
            className={`tables-item ${isActive ? "is-active" : ""} ${
              isContext ? "is-context" : ""
            } ${isEditing ? "is-editing" : ""}`}
            onClick={() => {
              if (isEditing) return;
              router.push(`${baseHref}?platformId=${platform.id}`);
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              setContextMenu({
                platform,
                x: event.clientX,
                y: event.clientY,
              });
            }}
          >
            {isEditing ? (
              <>
                <input
                  className="tables-item-input"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.stopPropagation();
                      if (pendingConfirmId === platform.id) {
                        submitRename(platform, draftName);
                      } else {
                        setPendingConfirmId(platform.id);
                      }
                    }
                    if (event.key === "Escape") {
                      event.preventDefault();
                      event.stopPropagation();
                      setEditingId(null);
                      setPendingConfirmId(null);
                    }
                  }}
                  autoFocus
                />
                <span className="tables-item-actions">
                  <button
                    type="button"
                    className="tables-item-cancel"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingId(null);
                      setPendingConfirmId(null);
                    }}
                    disabled={isSaving}
                    aria-label="Cancel rename"
                  >
                    <X size={16} />
                  </button>
                  <button
                    type="button"
                    className="tables-item-confirm"
                    ref={confirmRef}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (pendingConfirmId === platform.id) {
                        submitRename(platform, draftName);
                      } else {
                        setPendingConfirmId(platform.id);
                      }
                    }}
                    disabled={isSaving}
                    aria-label="Confirm rename"
                  >
                    <CircleCheck size={16} />
                  </button>
                </span>
                {pendingConfirmId === platform.id && (
                  <div className="confirm-bubble">
                    Press again to confirm change
                  </div>
                )}
              </>
            ) : (
              platform.name
            )}
          </button>
        );
      })}
      {contextMenu && (
        <div
          className="context-menu"
          ref={menuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setEditingId(contextMenu.platform.id);
              setDraftName(contextMenu.platform.name);
              setContextMenu(null);
            }}
          >
            Rename
          </button>
          <button type="button" role="menuitem" onClick={() => setContextMenu(null)}>
            Share
          </button>
        </div>
      )}
    </>
  );
}
