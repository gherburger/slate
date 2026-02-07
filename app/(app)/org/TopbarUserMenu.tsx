"use client";

import { UserButton } from "@clerk/nextjs";

export default function TopbarUserMenu() {
  return (
    <div className="topbar-user">
      <UserButton afterSignOutUrl="/" />
    </div>
  );
}
