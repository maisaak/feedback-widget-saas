export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json({
    status: "ok",
    database: process.env.DATABASE_URL ? "postgres" : "pglite",
    timestamp: new Date().toISOString(),
  });
}
