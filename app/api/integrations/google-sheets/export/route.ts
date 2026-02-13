import { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import {
  IntegrationProvider,
  IntegrationStatus,
  UserType,
  type SpendEntry,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import {
  createSpreadsheet,
  refreshGoogleAccessToken,
  writeSheetValues,
} from "@/lib/google-sheets";

type ExportBody = {
  orgId?: string;
  platformId?: string;
  visibleColumnKeys?: string[];
};

type ColumnDef = {
  key: string;
  label: string;
  internalOnly?: boolean;
  value: (entry: SpendEntry) => string;
};

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function formatSpend(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amountCents / 100);
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: "id", label: "id", internalOnly: true, value: (entry) => entry.id },
  {
    key: "orgId",
    label: "orgId",
    internalOnly: true,
    value: (entry) => entry.orgId,
  },
  {
    key: "platformId",
    label: "platformId",
    internalOnly: true,
    value: (entry) => entry.platformId,
  },
  { key: "Date", label: "Date", value: (entry) => formatDate(entry.date) },
  {
    key: "Spend",
    label: "Spend",
    value: (entry) => formatSpend(entry.amountCents),
  },
  { key: "currency", label: "currency", value: (entry) => entry.currency },
  {
    key: "source",
    label: "source",
    internalOnly: true,
    value: (entry) => entry.source,
  },
  { key: "notes", label: "notes", value: (entry) => entry.notes ?? "" },
  {
    key: "createdByUserId",
    label: "createdByUserId",
    internalOnly: true,
    value: (entry) => entry.createdByUserId ?? "",
  },
  {
    key: "Created",
    label: "Created",
    internalOnly: true,
    value: (entry) => formatDate(entry.createdAt),
  },
  {
    key: "Updated",
    label: "Updated",
    internalOnly: true,
    value: (entry) => formatDate(entry.updatedAt),
  },
];

function reconnectResponse() {
  return Response.json(
    { error: "GOOGLE_SHEETS_NOT_CONNECTED" },
    { status: 409 },
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json()) as ExportBody;
  const orgId = body.orgId ?? "";
  const platformId = body.platformId ?? "";

  if (!orgId) return new Response("orgId required", { status: 400 });
  if (!platformId) return new Response("platformId required", { status: 400 });

  const authz = await requireRole({ orgId, action: "SPEND_READ" });
  if (!authz.ok) return new Response(authz.error, { status: authz.status });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userType: true },
  });
  const isInternal = user?.userType === UserType.INTERNAL;

  const allowedColumns = ALL_COLUMNS.filter(
    (column) => isInternal || !column.internalOnly,
  );
  const requestedSet = new Set(
    Array.isArray(body.visibleColumnKeys) ? body.visibleColumnKeys : [],
  );

  const selectedColumns = allowedColumns.filter((column) =>
    requestedSet.has(column.key),
  );
  const exportColumns = selectedColumns.length > 0 ? selectedColumns : allowedColumns;

  const platform = await prisma.platform.findFirst({
    where: { id: platformId, orgId },
    select: { id: true, name: true },
  });

  if (!platform) return new Response("platform not found", { status: 404 });

  const connection = await prisma.integrationConnection.findUnique({
    where: {
      orgId_userId_provider: {
        orgId,
        userId,
        provider: IntegrationProvider.GOOGLE_SHEETS,
      },
    },
  });

  if (!connection || connection.status !== IntegrationStatus.ACTIVE) {
    return reconnectResponse();
  }

  if (!connection.accessTokenCiphertext) return reconnectResponse();

  let accessToken = decryptSecret(connection.accessTokenCiphertext);
  const now = Date.now();
  const shouldRefresh =
    !connection.expiresAt || connection.expiresAt.getTime() <= now + 60_000;

  if (shouldRefresh) {
    if (!connection.refreshTokenCiphertext) {
      await prisma.integrationConnection.update({
        where: { id: connection.id },
        data: { status: IntegrationStatus.ERROR },
      });
      return reconnectResponse();
    }

    const refreshToken = decryptSecret(connection.refreshTokenCiphertext);
    const refreshed = await refreshGoogleAccessToken(refreshToken);

    if (!refreshed.ok) {
      if (refreshed.error === "invalid_grant") {
        await prisma.integrationConnection.update({
          where: { id: connection.id },
          data: { status: IntegrationStatus.ERROR },
        });
        return reconnectResponse();
      }

      return Response.json(
        { error: "GOOGLE_SHEETS_REFRESH_FAILED" },
        { status: 502 },
      );
    }

    accessToken = refreshed.data.access_token;
    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        status: IntegrationStatus.ACTIVE,
        accessTokenCiphertext: encryptSecret(refreshed.data.access_token),
        refreshTokenCiphertext: refreshed.data.refresh_token
          ? encryptSecret(refreshed.data.refresh_token)
          : connection.refreshTokenCiphertext,
        expiresAt: new Date(Date.now() + (refreshed.data.expires_in ?? 3600) * 1000),
        scopes: refreshed.data.scope ?? connection.scopes,
      },
    });
  }

  const entries = await prisma.spendEntry.findMany({
    where: { orgId, platformId },
    orderBy: { date: "desc" },
    take: 50,
  });

  const titleDate = new Date().toISOString().slice(0, 10);
  const title = `${platform.name} Export ${titleDate}`;

  const createResult = await createSpreadsheet(accessToken, title);
  if (!createResult.ok) {
    if (createResult.status === 401) {
      await prisma.integrationConnection.update({
        where: { id: connection.id },
        data: { status: IntegrationStatus.ERROR },
      });
      return reconnectResponse();
    }

    return Response.json(
      { error: "GOOGLE_SHEETS_CREATE_FAILED" },
      { status: 502 },
    );
  }

  const rows = [
    exportColumns.map((column) => column.label),
    ...entries.map((entry) => exportColumns.map((column) => column.value(entry))),
  ];

  const writeResult = await writeSheetValues(
    accessToken,
    createResult.data.spreadsheetId,
    rows,
  );

  if (!writeResult.ok) {
    return Response.json(
      { error: "GOOGLE_SHEETS_WRITE_FAILED" },
      { status: 502 },
    );
  }

  await prisma.integrationConnection.update({
    where: { id: connection.id },
    data: { lastSyncedAt: new Date() },
  });

  return Response.json({
    spreadsheetId: createResult.data.spreadsheetId,
    spreadsheetUrl: createResult.data.spreadsheetUrl,
  });
}
