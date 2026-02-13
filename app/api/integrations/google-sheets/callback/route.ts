import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { IntegrationProvider, IntegrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";
import { exchangeGoogleCodeForTokens } from "@/lib/google-sheets";
import {
  GOOGLE_OAUTH_NONCE_COOKIE,
  decodeOAuthState,
  sanitizeReturnTo,
} from "@/lib/oauth-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectWithParams(
  req: NextRequest,
  returnTo: string,
  params: Record<string, string>,
) {
  const url = new URL(returnTo, req.nextUrl.origin);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = NextResponse.redirect(url);
  response.cookies.set({
    name: GOOGLE_OAUTH_NONCE_COOKIE,
    value: "",
    maxAge: 0,
    path: "/api/integrations/google-sheets/callback",
  });
  return response;
}

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const state = req.nextUrl.searchParams.get("state") ?? "";
  const code = req.nextUrl.searchParams.get("code") ?? "";
  const oauthError = req.nextUrl.searchParams.get("error") ?? "";

  const decoded = decodeOAuthState(state);
  if (!decoded.ok) {
    return new Response("Invalid OAuth state", { status: 400 });
  }

  const safeReturnTo = sanitizeReturnTo(
    decoded.payload.returnTo,
    `/org/${decoded.payload.orgId}/integrations`,
  );

  if (decoded.payload.userId !== userId) {
    return redirectWithParams(req, safeReturnTo, {
      error: "google_sheets_user_mismatch",
    });
  }

  const cookieNonce = req.cookies.get(GOOGLE_OAUTH_NONCE_COOKIE)?.value;
  if (!cookieNonce || cookieNonce !== decoded.payload.nonce) {
    return redirectWithParams(req, safeReturnTo, {
      error: "google_sheets_nonce_mismatch",
    });
  }

  if (oauthError) {
    return redirectWithParams(req, safeReturnTo, {
      error: "google_sheets_oauth_denied",
    });
  }

  if (!code) {
    return redirectWithParams(req, safeReturnTo, {
      error: "google_sheets_missing_code",
    });
  }

  const membership = await prisma.membership.findUnique({
    where: {
      orgId_userId: { orgId: decoded.payload.orgId, userId },
    },
    select: { orgId: true },
  });

  if (!membership) {
    return redirectWithParams(req, safeReturnTo, {
      error: "google_sheets_membership_missing",
    });
  }

  const tokenExchange = await exchangeGoogleCodeForTokens(code);
  if (!tokenExchange.ok) {
    return redirectWithParams(req, safeReturnTo, {
      error: "google_sheets_token_exchange_failed",
    });
  }

  const now = Date.now();
  const expiresInSeconds = tokenExchange.data.expires_in ?? 3600;
  const expiresAt = new Date(now + expiresInSeconds * 1000);

  await prisma.integrationConnection.upsert({
    where: {
      orgId_userId_provider: {
        orgId: decoded.payload.orgId,
        userId,
        provider: IntegrationProvider.GOOGLE_SHEETS,
      },
    },
    update: {
      status: IntegrationStatus.ACTIVE,
      accessTokenCiphertext: encryptSecret(tokenExchange.data.access_token),
      refreshTokenCiphertext: tokenExchange.data.refresh_token
        ? encryptSecret(tokenExchange.data.refresh_token)
        : undefined,
      expiresAt,
      scopes: tokenExchange.data.scope ?? undefined,
    },
    create: {
      orgId: decoded.payload.orgId,
      userId,
      provider: IntegrationProvider.GOOGLE_SHEETS,
      status: IntegrationStatus.ACTIVE,
      accessTokenCiphertext: encryptSecret(tokenExchange.data.access_token),
      refreshTokenCiphertext: tokenExchange.data.refresh_token
        ? encryptSecret(tokenExchange.data.refresh_token)
        : null,
      expiresAt,
      scopes: tokenExchange.data.scope ?? null,
    },
  });

  const successRedirect = redirectWithParams(req, safeReturnTo, {
    connected: "google_sheets",
  });
  return successRedirect;
}
