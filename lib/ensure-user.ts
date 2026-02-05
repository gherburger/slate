import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function ensureDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const name = user?.fullName ?? null;
  const avatarUrl = user?.imageUrl ?? null;

  return prisma.user.upsert({
    where: { id: userId },
    update: {
      email: email || undefined,
      name: name || undefined,
      avatarUrl: avatarUrl || undefined,
    },
    create: {
      id: userId,
      email,
      name,
      avatarUrl,
    },
  });
}
