"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Table,
  Settings2,
  LayoutGrid,
  Settings,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
};

export default function SidebarNav({ orgId }: { orgId: string | null }) {
  const pathname = usePathname();
  const base = orgId ? `/org/${orgId}` : "/org";
  const items: Array<NavItem & { Icon: LucideIcon }> = [
    { label: "Dashboard", href: `${base}/dashboard`, Icon: LayoutDashboard },
    { label: "My Data", href: `${base}/mydata`, Icon: Table },
    { label: "Rules", href: `${base}/rules`, Icon: Settings2 },
    { label: "Data Sources", href: `${base}/integrations`, Icon: LayoutGrid },
    { label: "Settings", href: `${base}/settings`, Icon: Settings },
  ];

  return (
    <nav className="sidebar-nav">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (pathname ? pathname.startsWith(`${item.href}/`) : false);
        const Icon = item.Icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`sidebar-link ${isActive ? "is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={16} className="sidebar-icon" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
