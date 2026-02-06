import { Webhook } from "svix";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function mapClerkRole(role: string | null | undefined) {
  const value = role?.toLowerCase() ?? "";
  if (value.includes("admin")) return "ADMIN" as const;
  if (value.includes("editor")) return "EDITOR" as const;
  return "VIEWER" as const;
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });

  const hdrs = await headers();
  const svix_id = hdrs.get("svix-id");
  const svix_timestamp = hdrs.get("svix-timestamp");
  const svix_signature = hdrs.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  const payload = await req.text();

  try {
    await prisma.webhookEvent.create({
      data: { source: "clerk", eventId: svix_id },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return new Response("ok", { status: 200 });
      }
    }
    throw err;
  }

  let evt: any;
  try {
    evt = new Webhook(secret).verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  // Handle user.created (and optionally user.updated)
  if (evt.type === "user.created" || evt.type === "user.updated") {
    const u = evt.data;
    const id = u.id as string;
    const email =
      (u.email_addresses?.[0]?.email_address as string | undefined) ??
      `${id}@users.clerk.invalid`;
    const first = u.first_name ?? "";
    const last = u.last_name ?? "";
    const name = `${first} ${last}`.trim() || null;
    const avatarUrl = (u.image_url as string) ?? null;

    await prisma.user.upsert({
      where: { id },
      update: {
        email: email || undefined,
        name: name || undefined,
        avatarUrl: avatarUrl || undefined,
      },
      create: { id, email, name, avatarUrl },
    });

  }

  // Handle organization.created (org row only)
  if (evt.type === "organization.created") {
    const o = evt.data;
    const externalId = o.id as string;
    const name = (o.name as string) ?? "My Workspace";

    await prisma.org.upsert({
      where: { externalId },
      update: { name },
      create: { externalId, name },
    });
  }

  // Handle organizationMembership.created
  if (evt.type === "organizationMembership.created") {
    const m = evt.data;
    const userId =
      (m.user_id as string | undefined) ??
      (m.public_user_data?.user_id as string | undefined);
    const orgExternalId =
      (m.organization?.id as string | undefined) ??
      (m.organization_id as string | undefined);

    if (userId && orgExternalId) {
      const identifier = m.public_user_data?.identifier as string | undefined;
      const email =
        identifier && identifier.includes("@")
          ? identifier
          : `${userId}@users.clerk.invalid`;
      const first = m.public_user_data?.first_name ?? "";
      const last = m.public_user_data?.last_name ?? "";
      const name = `${first} ${last}`.trim() || null;
      const avatarUrl = (m.public_user_data?.image_url as string | null) ?? null;

      await prisma.user.upsert({
        where: { id: userId },
        update: {
          email: email || undefined,
          name: name || undefined,
          avatarUrl: avatarUrl || undefined,
        },
        create: { id: userId, email, name, avatarUrl },
      });

      const orgName =
        (m.organization?.name as string | undefined) ?? "My Workspace";
      const dbOrg = await prisma.org.upsert({
        where: { externalId: orgExternalId },
        update: { name: orgName },
        create: { externalId: orgExternalId, name: orgName },
      });

      const role = mapClerkRole(m.role as string | undefined);

      await prisma.membership.upsert({
        where: { orgId_userId: { orgId: dbOrg.id, userId } },
        update: { role },
        create: { orgId: dbOrg.id, userId, role },
      });
    }
  }

  return new Response("ok", { status: 200 });
}
