import { randomBytes } from "crypto";
import { signPayload } from "@/lib/crypto";

type OAuthStatePayload = {
  orgId: string;
  userId: string;
  returnTo: string;
  nonce: string;
  iat: number;
};

const TEN_MINUTES_SECONDS = 10 * 60;

export function createOAuthNonce() {
  return randomBytes(18).toString("base64url");
}

export function sanitizeReturnTo(returnTo: string | null | undefined, fallback: string) {
  if (!returnTo) return fallback;
  if (!returnTo.startsWith("/")) return fallback;
  if (returnTo.startsWith("//")) return fallback;
  if (returnTo.includes("://")) return fallback;
  return returnTo;
}

export function encodeOAuthState(input: Omit<OAuthStatePayload, "iat">) {
  const payload: OAuthStatePayload = {
    ...input,
    iat: Math.floor(Date.now() / 1000),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function decodeOAuthState(state: string) {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) {
    return { ok: false as const, error: "invalid_state_format" };
  }

  const expectedSignature = signPayload(encoded);
  if (signature !== expectedSignature) {
    return { ok: false as const, error: "invalid_state_signature" };
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OAuthStatePayload;
    if (!parsed.orgId || !parsed.userId || !parsed.returnTo || !parsed.nonce || !parsed.iat) {
      return { ok: false as const, error: "invalid_state_payload" };
    }

    const now = Math.floor(Date.now() / 1000);
    if (now - parsed.iat > TEN_MINUTES_SECONDS) {
      return { ok: false as const, error: "expired_state" };
    }

    return { ok: true as const, payload: parsed };
  } catch {
    return { ok: false as const, error: "invalid_state_payload" };
  }
}

export const GOOGLE_OAUTH_NONCE_COOKIE = "google_oauth_nonce";
export const GOOGLE_OAUTH_NONCE_TTL_SECONDS = TEN_MINUTES_SECONDS;
