"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";

export default function TopbarOrgSwitcher() {
  return (
    <div className="org-switcher">
      <OrganizationSwitcher
        afterSelectOrganizationUrl="/org/refresh"
        afterCreateOrganizationUrl="/org/refresh"
        afterLeaveOrganizationUrl="/org/refresh"
      />
    </div>
  );
}
