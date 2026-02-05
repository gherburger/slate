import { prisma } from "../lib/prisma";
import { normalizePlatform } from "../lib/normalize";

async function main() {
  await prisma.platform.upsert({
    where: { key: normalizePlatform("Google Ads") },
    update: { name: "Google Ads" },
    create: { key: normalizePlatform("Google Ads"), name: "Google Ads" },
  });

  await prisma.platform.upsert({
    where: { key: normalizePlatform("Meta") },
    update: { name: "Meta" },
    create: { key: normalizePlatform("Meta"), name: "Meta" },
  });

  await prisma.platform.upsert({
    where: { key: normalizePlatform("LinkedIn Ads") },
    update: { name: "LinkedIn Ads" },
    create: { key: normalizePlatform("LinkedIn Ads"), name: "LinkedIn Ads" },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
