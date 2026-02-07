import { prisma } from "../lib/prisma";
import { normalizePlatform } from "../lib/normalize";

async function main() {
  const googleKey = normalizePlatform("Google Ads");
  const googleExisting = await prisma.platform.findFirst({
    where: { orgId: null, key: googleKey },
  });

  if (googleExisting) {
    await prisma.platform.update({
      where: { id: googleExisting.id },
      data: { name: "Google Ads" },
    });
  } else {
    await prisma.platform.create({
      data: {
        key: googleKey,
        name: "Google Ads",
        scope: "GLOBAL",
        provider: "GOOGLE_ADS",
      },
    });
  }

  const metaKey = normalizePlatform("Meta");
  const metaExisting = await prisma.platform.findFirst({
    where: { orgId: null, key: metaKey },
  });

  if (metaExisting) {
    await prisma.platform.update({
      where: { id: metaExisting.id },
      data: { name: "Meta" },
    });
  } else {
    await prisma.platform.create({
      data: {
        key: metaKey,
        name: "Meta",
        scope: "GLOBAL",
        provider: "META",
      },
    });
  }

  const linkedinKey = normalizePlatform("LinkedIn Ads");
  const linkedinExisting = await prisma.platform.findFirst({
    where: { orgId: null, key: linkedinKey },
  });

  if (linkedinExisting) {
    await prisma.platform.update({
      where: { id: linkedinExisting.id },
      data: { name: "LinkedIn Ads" },
    });
  } else {
    await prisma.platform.create({
      data: {
        key: linkedinKey,
        name: "LinkedIn Ads",
        scope: "GLOBAL",
        provider: "LINKEDIN_ADS",
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
