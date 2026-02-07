import { auth } from "@clerk/nextjs/server";
import { ensureDbUser } from "@/lib/ensure-user";
import TopbarOrgSwitcher from "@/app/(app)/org/TopbarOrgSwitcher";
import TopbarUserMenu from "@/app/(app)/org/TopbarUserMenu";
import SidebarNav from "@/app/(app)/org/SidebarNav";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureDbUser();
  const { orgId } = await auth();
  const dbOrg = orgId
    ? await prisma.org.findUnique({ where: { externalId: orgId } })
    : null;

  return (
    <div className="app-frame">
      <header className="app-topbar">
        <div className="topbar-left">
          <div className="logo-badge">
            <img src="/logo-sq-transparent.png" alt="Slate logo" />
          </div>
          <span className="logo-divider" aria-hidden="true" />
          <TopbarOrgSwitcher />
        </div>
        <div className="topbar-right">
          <span className="status-pill">
            <span className="status-dot" />
            All OK
          </span>
          <button className="ghost-icon" aria-label="Notifications">
            ⟳
          </button>
          <button className="marketing-primary">Upgrade</button>
          <TopbarUserMenu />
        </div>
      </header>
      <div className="app-body">
        <aside className="app-sidebar">
          <div className="sidebar-section">
            <p className="sidebar-title">Workspace</p>
            <SidebarNav orgId={dbOrg?.id ?? null} />
          </div>
          <div className="sidebar-section">
            <p className="sidebar-title">Developer</p>
            <nav className="sidebar-nav">
              <div className="sidebar-link">
                <span className="sidebar-icon">⎈</span>
                Data API
              </div>
              <div className="sidebar-link">
                <span className="sidebar-icon">⎈</span>
                Integrations
              </div>
              <div className="sidebar-link">
                <span className="sidebar-icon">⎈</span>
                Auth
              </div>
              <div className="sidebar-link">
                <span className="sidebar-icon">⎈</span>
                Settings
              </div>
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
