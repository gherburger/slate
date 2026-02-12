"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PlatformItem = {
  id: string;
  name: string;
};

export default function PlatformMenu({
  platforms,
  baseHref,
}: {
  platforms: PlatformItem[];
  baseHref: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("platformId");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    platform: PlatformItem;
    x: number;
    y: number;
  } | null>(null);

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

  return (
    <>
      {platforms.map((platform) => {
        const isActive = platform.id === activeId;
        const isContext = contextMenu?.platform.id === platform.id;
        return (
          <button
            key={platform.id}
            type="button"
            className={`tables-item ${isActive ? "is-active" : ""} ${
              isContext ? "is-context" : ""
            }`}
            onClick={() =>
              router.push(`${baseHref}?platformId=${platform.id}`)
            }
            onContextMenu={(event) => {
              event.preventDefault();
              setContextMenu({
                platform,
                x: event.clientX,
                y: event.clientY,
              });
            }}
          >
            {platform.name}
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
          <button type="button" role="menuitem" onClick={() => setContextMenu(null)}>
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
