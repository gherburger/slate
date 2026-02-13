import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { buildGoogleOAuthUrl } from "@/lib/google-sheets";
import {
  GOOGLE_OAUTH_NONCE_COOKIE,
  GOOGLE_OAUTH_NONCE_TTL_SECONDS,
  createOAuthNonce,
  encodeOAuthState,
  sanitizeReturnTo,
} from "@/lib/oauth-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const orgId = req.nextUrl.searchParams.get("orgId") ?? "";
  if (!orgId) return new Response("orgId required", { status: 400 });

  const membership = await prisma.membership.findUnique({
    where: { orgId_userId: { orgId, userId } },
    select: { orgId: true },
  });

  if (!membership) return new Response("Forbidden", { status: 403 });

  const fallbackReturnTo = `/org/${orgId}/integrations`;
  const returnTo = sanitizeReturnTo(
    req.nextUrl.searchParams.get("returnTo"),
    fallbackReturnTo,
  );

  const nonce = createOAuthNonce();
  const state = encodeOAuthState({
    orgId,
    userId,
    returnTo,
    nonce,
  });

  const authUrl = buildGoogleOAuthUrl(state);
  const response = NextResponse.redirect(authUrl);

  response.cookies.set({
    name: GOOGLE_OAUTH_NONCE_COOKIE,
    value: nonce,
    maxAge: GOOGLE_OAUTH_NONCE_TTL_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/integrations/google-sheets/callback",
  });

  return response;
}
