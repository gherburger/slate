// app/org/[orgId]/layout.tsx
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const { userId } = await auth();
  if (!userId) return redirect("/sign-in");

  const membership = await prisma.membership.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId,
      },
    },
    include: { org: true },
  });

  if (!membership) return redirect("/403");

  // Optional: render a basic shell with org name / role
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 600 }}>{membership.org.name}</div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>Role: {membership.role}</div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  );
}
