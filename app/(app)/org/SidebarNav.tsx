"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
};

export default function SidebarNav({ orgId }: { orgId: string | null }) {
  const pathname = usePathname();
  const base = orgId ? `/org/${orgId}` : "/org";
  const items: NavItem[] = [
    { label: "Dashboard", href: `${base}/dashboard` },
    { label: "My Data", href: `${base}/mydata` },
    { label: "Rules", href: `${base}/rules` },
    { label: "Data Sources", href: `${base}/integrations` },
    { label: "Settings", href: `${base}/settings` },
  ];

  return (
    <nav className="sidebar-nav">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (pathname ? pathname.startsWith(`${item.href}/`) : false);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`sidebar-link ${isActive ? "is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="sidebar-icon">▦</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
