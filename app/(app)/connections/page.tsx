export default function ConnectionsPage() {
  return (
    <section className="connections-shell">
      <div className="connections-header">
        <h1>All apps</h1>
      </div>
      <div className="connections-layout">
        <aside className="connections-filter">
          <button className="link-button">Collapse all</button>
          <div className="filter-section">
            <div className="filter-header">
              <span>Category</span>
              <span className="chevron">▴</span>
            </div>
            <div className="filter-item is-active">
              <span className="radio-dot" />
              All categories
            </div>
            {[
              "Accounting",
              "Advertising",
              "CDP",
              "CRM",
              "Data Warehouse",
              "Design & Content",
              "Direct Mail",
              "Donations",
              "eCommerce Platform",
              "Email Service Provider",
              "Event Management",
              "Fundraising",
              "Health & Wellness",
              "Journey Optimization",
              "Landing Pages & Forms",
              "Payments",
              "Personalization",
            ].map((label) => (
              <div key={label} className="filter-item">
                <span className="radio-outline" />
                {label}
              </div>
            ))}
          </div>
        </aside>
        <div className="connections-grid">
          {[
            {
              name: "29 Next",
              vendor: "Built by 29 Next",
              description:
                "DTC ecommerce platform designed for performance-obsessed brands.",
            },
            {
              name: "ActBlue",
              vendor: "Built by Klaviyo",
              description:
                "Personalize emails based on each contributor's donation & web activity.",
            },
            {
              name: "AdRoll",
              vendor: "Built by AdRoll",
              description:
                "Leverage your list and segments to run targeted web, social, and CTV ads.",
            },
            {
              name: "Adzviser",
              vendor: "Built by Adzviser LLC",
              description:
                "Adzviser integrate marketing & data for real-time insights and reporting.",
            },
            {
              name: "AfterShip Email",
              vendor: "Built by AfterShip",
              description:
                "Marketing platform that empowers brands to drive leads, customer engagement.",
              highlight: true,
            },
            {
              name: "AfterShip Returns",
              vendor: "Built by AfterShip",
              description:
                "Personalize emails based on the RMA status tracked by AfterShip Returns.",
            },
            {
              name: "AfterShip Reviews",
              vendor: "Built by AfterShip",
              description:
                "Enables brands to boost conversions with great-looking social proof.",
            },
            {
              name: "AfterShip Tracking",
              vendor: "Built by AfterShip",
              description:
                "Proactive order tracking that reduces WISMO and optimizes delivery.",
            },
            {
              name: "Agent Convert",
              vendor: "Built by Agent Convert",
              description:
                "Free AI powered insights & recommendations to optimize your account.",
            },
            {
              name: "AI Marketing Agent",
              vendor: "Built by Enrich Labs",
              description:
                "We help Shopify merchants automate their email creation flows.",
            },
          ].map((app) => (
            <div
              key={app.name}
              className={`app-card ${app.highlight ? "is-highlight" : ""}`}
            >
              <div className="app-icon" />
              <div className="app-content">
                <h3>{app.name}</h3>
                <p className="app-vendor">{app.vendor}</p>
                <p className="app-description">{app.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
