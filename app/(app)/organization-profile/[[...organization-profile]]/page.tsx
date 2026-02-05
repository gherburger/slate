import { OrganizationProfile } from "@clerk/nextjs";

export default function OrganizationProfilePage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <OrganizationProfile />
    </main>
  );
}
