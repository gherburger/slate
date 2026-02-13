const GOOGLE_OAUTH_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_BASE_URL = "https://sheets.googleapis.com/v4";

export const GOOGLE_SHEETS_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
};

type TokenSuccess = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function getGoogleOAuthConfig() {
  return {
    clientId: requiredEnv("GOOGLE_CLIENT_ID"),
    clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    redirectUri: requiredEnv("GOOGLE_OAUTH_REDIRECT_URI"),
  };
}

export function buildGoogleOAuthUrl(state: string) {
  const { clientId, redirectUri } = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SHEETS_SCOPES.join(" "),
    state,
  });
  return `${GOOGLE_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

async function postToken(params: URLSearchParams) {
  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  let data: TokenResponse = {};
  try {
    data = (await response.json()) as TokenResponse;
  } catch {
    data = {};
  }
  if (!response.ok || !data.access_token) {
    return { ok: false as const, error: data.error ?? "token_exchange_failed" };
  }

  const normalized: TokenSuccess = {
    access_token: data.access_token,
    expires_in: data.expires_in ?? 3600,
    refresh_token: data.refresh_token,
    scope: data.scope,
    token_type: data.token_type,
  };

  return { ok: true as const, data: normalized };
}

export async function exchangeGoogleCodeForTokens(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  return postToken(params);
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });
  return postToken(params);
}

async function googleApi<T>(path: string, accessToken: string, init: RequestInit = {}) {
  const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  let data: (T & { error?: { message?: string } }) | null = null;
  try {
    data = (await response.json()) as T & { error?: { message?: string } };
  } catch {
    data = null;
  }
  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      error: data?.error?.message ?? "google_api_error",
    };
  }

  if (!data) {
    return {
      ok: false as const,
      status: response.status,
      error: "google_api_invalid_response",
    };
  }

  return { ok: true as const, data };
}

type SpreadsheetCreateResponse = {
  spreadsheetId: string;
  spreadsheetUrl: string;
};

export async function createSpreadsheet(accessToken: string, title: string) {
  return googleApi<SpreadsheetCreateResponse>("/spreadsheets", accessToken, {
    method: "POST",
    body: JSON.stringify({
      properties: { title },
    }),
  });
}

export async function writeSheetValues(
  accessToken: string,
  spreadsheetId: string,
  values: Array<Array<string | number>>,
) {
  const encodedId = encodeURIComponent(spreadsheetId);
  const params = new URLSearchParams({
    valueInputOption: "USER_ENTERED",
  });

  return googleApi(
    `/spreadsheets/${encodedId}/values/A1?${params.toString()}`,
    accessToken,
    {
      method: "PUT",
      body: JSON.stringify({
        range: "A1",
        majorDimension: "ROWS",
        values,
      }),
    },
  );
}
