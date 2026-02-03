export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    env: process.env.NEXT_PUBLIC_APP_ENV ?? "unknown",
    ts: new Date().toISOString(),
  });
}
