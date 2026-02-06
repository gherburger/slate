import { auth } from "@clerk/nextjs/server";
import { ensureDbUser } from "@/lib/ensure-user";
import { prisma } from "@/lib/prisma";
import OrgDropdown from "@/app/(app)/org/OrgDropdown";

const workspaceLinks = [
  { label: "Dashboard", active: false },
  { label: "Tables", active: true },
  { label: "Integrations", active: false },
  { label: "Settings", active: false },
];

const developerLinks = [
  { label: "Data API" },
  { label: "Auth" },
  { label: "Settings" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureDbUser();
  const { userId } = await auth();
  const memberships = userId
    ? await prisma.membership.findMany({
        where: { userId },
        include: { org: true },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const currentOrg = memberships[0]?.org;

  return (
    <div className="app-frame">
      <header className="app-topbar">
        <div className="topbar-left">
          <div className="logo-badge">S</div>
          <OrgDropdown
            currentOrgName={currentOrg?.name ?? "Organization Name"}
            memberships={memberships.map((membership, index) => ({
              id: membership.id,
              name: membership.org.name,
              isCurrent: index === 0,
            }))}
          />
        </div>
        <div className="topbar-right">
          <span className="status-pill">
            <span className="status-dot" />
            All OK
          </span>
          <button className="ghost-icon" aria-label="Notifications">
            ⟳
          </button>
          <button className="primary-pill">Upgrade</button>
          <div className="user-chip">GH</div>
        </div>
      </header>
      <div className="app-body">
        <aside className="app-sidebar">
          <div className="sidebar-section">
            <p className="sidebar-title">Workspace</p>
            <nav className="sidebar-nav">
              {workspaceLinks.map((item) => (
                <div
                  key={item.label}
                  className={`sidebar-link ${
                    item.active ? "is-active" : ""
                  }`}
                >
                  <span className="sidebar-icon">▦</span>
                  {item.label}
                </div>
              ))}
            </nav>
          </div>
          <div className="sidebar-section">
            <p className="sidebar-title">Developer</p>
            <nav className="sidebar-nav">
              {developerLinks.map((item) => (
                <div key={item.label} className="sidebar-link">
                  <span className="sidebar-icon">⎈</span>
                  {item.label}
                </div>
              ))}
            </nav>
          </div>
          <div className="sidebar-footer">
            <button className="ghost-pill">Feedback</button>
            <button className="ghost-pill">Collapse menu</button>
          </div>
        </aside>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
