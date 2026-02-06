import { auth } from "@clerk/nextjs/server";
import { ensureDbUser } from "@/lib/ensure-user";
import { prisma } from "@/lib/prisma";

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
          <div className="org-dropdown">
            <button className="org-trigger" type="button">
              <span className="org-name">
                {currentOrg?.name ?? "Organization Name"}
              </span>
              <span className="org-caret">▾</span>
            </button>
            <div className="org-menu" role="menu">
              {memberships.map((membership, index) => (
                <button
                  className={`org-item ${
                    index === 0 ? "is-current" : ""
                  }`}
                  key={membership.id}
                  type="button"
                  role="menuitem"
                >
                  <span className="org-check">✓</span>
                  {membership.org.name}
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
