// app/org/[orgId]/integrations/page.tsx
import { IntegrationProvider, IntegrationStatus } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type DataSource = {
  name: string;
  logo: string;
  logoUrl?: string;
  provider: IntegrationProvider | null;
};

const dataSources: DataSource[] = [
  {
    name: "Google Ads",
    logo: "GA",
    logoUrl: "/google-ads-logo.svg",
    provider: IntegrationProvider.GOOGLE_ADS,
  },
  {
    name: "Google Sheets",
    logo: "GS",
    logoUrl: "/google-sheets-logo.svg",
    provider: IntegrationProvider.GOOGLE_SHEETS,
  },
  {
    name: "Meta Ads",
    logo: "M",
    logoUrl: "/meta-ads-logo.svg",
    provider: IntegrationProvider.META,
  },
  {
    name: "Linkedin Ads",
    logo: "L",
    logoUrl: "/linkedin-ads-logo.svg",
    provider: IntegrationProvider.LINKEDIN_ADS,
  },
  {
    name: "Shopify",
    logo: "S",
    logoUrl: "/shopify-logo.svg",
    provider: null,
  },
];

export default async function DataSourcesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const { userId } = await auth();
  const providers = dataSources
    .map((source) => source.provider)
    .filter((provider): provider is IntegrationProvider => provider !== null);

  const connections = await prisma.integrationConnection.findMany({
    where: {
      orgId,
      ...(userId ? { userId } : {}),
      provider: { in: providers },
    },
    select: {
      provider: true,
      status: true,
    },
  });

  const connectionByProvider = new Map(
    connections.map((connection) => [connection.provider, connection.status]),
  );
  const connectReturnTo = `/org/${orgId}/integrations`;
  const googleSheetsConnectHref = `/api/integrations/google-sheets/connect?orgId=${encodeURIComponent(orgId)}&returnTo=${encodeURIComponent(connectReturnTo)}`;

  return (
    <section className="data-sources">
      <div className="data-sources-header">
        <div className="page-header">
          <h1>Data Sources</h1>
          <p>Manage apps that sync your activity and data to and from Slate.</p>
        </div>
        <div className="data-sources-actions">
          <button className="ghost-pill">Manage data ▾</button>
          <button className="ghost-pill">Developers ▾</button>
          <button className="primary-pill">Explore apps</button>
        </div>
      </div>

      <div className="data-sources-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {dataSources.map((source) => (
              <tr key={source.name}>
                <td>
                  <div className="source-name">
                    <div className="source-logo">
                      {source.logoUrl ? (
                        <img src={source.logoUrl} alt="" />
                      ) : (
                        source.logo
                      )}
                    </div>
                    <span className="source-link">{source.name}</span>
                  </div>
                </td>
                <td>
                  {source.provider &&
                  connectionByProvider.get(source.provider) ===
                  IntegrationStatus.ACTIVE ? (
                    <span className="status-pill success">Enabled</span>
                  ) : source.provider === IntegrationProvider.GOOGLE_SHEETS ? (
                    <a href={googleSheetsConnectHref} className="connect-app-pill">
                      Connect App
                    </a>
                  ) : (
                    <button type="button" className="connect-app-pill" disabled>
                      Connect App
                    </button>
                  )}
                </td>
                <td className="row-actions">
                  <button className="ghost-icon" aria-label="More options">
                    ⋯
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
