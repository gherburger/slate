import { prisma } from "../lib/prisma";
import { normalizePlatform } from "../lib/normalize";

async function main() {
  const orgId = process.env.SEED_ORG_ID;
  if (!orgId) {
    throw new Error("SEED_ORG_ID is required to seed platforms.");
  }

  const googleKey = normalizePlatform("Google Ads");
  await prisma.platform.upsert({
    where: { orgId_key: { orgId, key: googleKey } },
    update: { name: "Google Ads", provider: "GOOGLE_ADS" },
    create: {
      orgId,
      key: googleKey,
      name: "Google Ads",
      provider: "GOOGLE_ADS",
    },
  });

  const metaKey = normalizePlatform("Meta");
  await prisma.platform.upsert({
    where: { orgId_key: { orgId, key: metaKey } },
    update: { name: "Meta", provider: "META" },
    create: {
      orgId,
      key: metaKey,
      name: "Meta",
      provider: "META",
    },
  });

  const linkedinKey = normalizePlatform("LinkedIn Ads");
  await prisma.platform.upsert({
    where: { orgId_key: { orgId, key: linkedinKey } },
    update: { name: "LinkedIn Ads", provider: "LINKEDIN_ADS" },
    create: {
      orgId,
      key: linkedinKey,
      name: "LinkedIn Ads",
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
