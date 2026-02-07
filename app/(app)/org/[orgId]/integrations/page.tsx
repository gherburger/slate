// app/org/[orgId]/integrations/page.tsx
const dataSources = [
  {
    name: "Canva",
    category: "Design & content",
    status: "Action required",
    statusTone: "warning",
    logo: "C",
  },
  {
    name: "Chargebee",
    category: "Subscriptions",
    status: "Enabled",
    statusTone: "success",
    logo: "CB",
  },
  {
    name: "Google Ads",
    category: "Advertising",
    status: "Enabled",
    statusTone: "success",
    logo: "GA",
  },
  {
    name: "Meta Ads",
    category: "Advertising",
    status: "Enabled",
    statusTone: "success",
    logo: "M",
  },
  {
    name: "Shopify",
    category: "eCommerce platform",
    status: "Enabled",
    statusTone: "success",
    logo: "S",
  },
];

export default function DataSourcesPage() {
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
              <th>Category</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {dataSources.map((source) => (
              <tr key={source.name}>
                <td>
                  <div className="source-name">
                    <div className="source-logo">{source.logo}</div>
                    <span className="source-link">{source.name}</span>
                  </div>
                </td>
                <td className="source-category">{source.category}</td>
                <td>
                  <span className={`status-pill ${source.statusTone}`}>
                    {source.status}
                  </span>
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
