import { prisma } from "../lib/prisma";

async function main() {
  await prisma.platform.upsert({
    where: { key: "google_ads" },
    update: {},
    create: { key: "google_ads", name: "Google Ads" },
  });

  await prisma.platform.upsert({
    where: { key: "meta" },
    update: {},
    create: { key: "meta", name: "Meta" },
  });

  await prisma.platform.upsert({
    where: { key: "linkedin_ads" },
    update: {},
    create: { key: "linkedin_ads", name: "LinkedIn Ads" },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
