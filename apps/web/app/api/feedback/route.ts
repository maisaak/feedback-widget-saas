import { findProjectByApiKey, insertFeedback } from "../../../lib/data";
import { notifyFeedback } from "../../../lib/notifications";
import { checkRateLimit } from "../../../lib/rate-limit";
import { apiKeySchema, feedbackSchema } from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  "Access-Control-Max-Age": "86400",
};

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const apiKey = apiKeySchema.safeParse(request.headers.get("x-api-key"));
    if (!apiKey.success) {
      return Response.json({ error: "invalid_api_key" }, { status: 401, headers: corsHeaders });
    }
    const project = await findProjectByApiKey(apiKey.data);
    if (!project) {
      return Response.json({ error: "invalid_api_key" }, { status: 401, headers: corsHeaders });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")?.trim()
      || "unknown";
    const ipLimit = checkRateLimit(`ip:${ip}`, 10, 60_000);
    const keyLimit = checkRateLimit(`api-key:${project.id}`, 10, 60_000);
    if (!ipLimit.ok || !keyLimit.ok) {
      const retryAfter = Math.max(1, Math.ceil(Math.max(ipLimit.retryAfterMs, keyLimit.retryAfterMs) / 1000));
      return Response.json({ error: "rate_limited" }, {
        status: 429,
        headers: { ...corsHeaders, "Retry-After": String(retryAfter) },
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({
        error: "invalid_payload",
        issues: [{ path: [], message: "Invalid JSON" }],
      }, { status: 400, headers: corsHeaders });
    }
    const payload = feedbackSchema.safeParse(body);
    if (!payload.success) {
      return Response.json({
        error: "invalid_payload",
        issues: payload.error.issues.map(({ path, message }) => ({ path, message })),
      }, { status: 400, headers: corsHeaders });
    }

    const feedback = await insertFeedback({ projectId: project.id, ...payload.data });
    void notifyFeedback(feedback).catch((error: unknown) => {
      console.error("Feedback notification failed", error);
    });
    return Response.json({
      id: feedback.id,
      createdAt: feedback.createdAt,
      status: feedback.status,
    }, { status: 201, headers: corsHeaders });
  } catch (error: unknown) {
    console.error("Feedback request failed", error);
    return Response.json({ error: "internal_error" }, { status: 500, headers: corsHeaders });
  }
}
