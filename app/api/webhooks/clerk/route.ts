import { Webhook } from "svix";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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
    const email = (u.email_addresses?.[0]?.email_address as string) ?? "";
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

  return new Response("ok", { status: 200 });
}
