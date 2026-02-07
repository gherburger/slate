import { prisma } from "../lib/prisma";
import { normalizePlatform } from "../lib/normalize";

async function main() {
  await prisma.platform.upsert({
    where: { orgId_key: { orgId: null, key: normalizePlatform("Google Ads") } },
    update: { name: "Google Ads" },
    create: {
      key: normalizePlatform("Google Ads"),
      name: "Google Ads",
      scope: "GLOBAL",
      provider: "GOOGLE_ADS",
    },
  });

  await prisma.platform.upsert({
    where: { orgId_key: { orgId: null, key: normalizePlatform("Meta") } },
    update: { name: "Meta" },
    create: {
      key: normalizePlatform("Meta"),
      name: "Meta",
      scope: "GLOBAL",
      provider: "META",
    },
  });

  await prisma.platform.upsert({
    where: {
      orgId_key: { orgId: null, key: normalizePlatform("LinkedIn Ads") },
    },
    update: { name: "LinkedIn Ads" },
    create: {
      key: normalizePlatform("LinkedIn Ads"),
      name: "LinkedIn Ads",
      scope: "GLOBAL",
      provider: "LINKEDIN_ADS",
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
