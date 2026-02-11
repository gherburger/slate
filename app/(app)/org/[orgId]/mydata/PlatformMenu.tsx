"use client";

import { useRouter, useSearchParams } from "next/navigation";

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

  return (
    <>
      {platforms.map((platform) => {
        const isActive = platform.id === activeId;
        return (
          <button
            key={platform.id}
            type="button"
            className={`tables-item ${isActive ? "is-active" : ""}`}
            onClick={() =>
              router.push(`${baseHref}?platformId=${platform.id}`)
            }
          >
            {platform.name}
          </button>
        );
      })}
    </>
  );
}
