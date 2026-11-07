#!/usr/bin/env node
/**
 * API contract smoke test. Requires a running server.
 *
 *   BASE_URL=http://localhost:3000 API_KEY=<project api key> node scripts/smoke.mjs
 *
 * Exits with code 1 on the first failed expectation.
 */

const baseUrl = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is required. Run `corepack pnpm db:seed` and copy the printed key.");
  process.exit(1);
}

let failures = 0;

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  ok    ${name}`);
    return;
  }
  failures += 1;
  console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function post(body, key = apiKey) {
  const response = await fetch(`${baseUrl}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON error page */
  }
  return { status: response.status, json, text, headers: response.headers };
}

console.log(`Smoke testing ${baseUrl}`);

const health = await fetch(`${baseUrl}/api/health`);
const healthBody = await health.json().catch(() => null);
check("GET /api/health returns 200", health.status === 200, String(health.status));
check("health reports a driver", healthBody?.database === "pglite" || healthBody?.database === "postgres");

const preflight = await fetch(`${baseUrl}/api/feedback`, { method: "OPTIONS" });
check("OPTIONS /api/feedback returns 204", preflight.status === 204, String(preflight.status));
check("preflight allows any origin", preflight.headers.get("access-control-allow-origin") === "*");
check("preflight allows x-api-key", /x-api-key/i.test(preflight.headers.get("access-control-allow-headers") ?? ""));

const created = await post({ message: "Smoke test submission", rating: 4, email: "smoke@example.com" });
check("valid submission returns 201", created.status === 201, `${created.status} ${created.text}`);
check("response carries an id", typeof created.json?.id === "string");
check("new feedback defaults to status new", created.json?.status === "new");

const unknownKey = await post({ message: "nope" }, "00000000-0000-4000-8000-000000000000");
check("unknown api key returns 401", unknownKey.status === 401, String(unknownKey.status));

const malformedKey = await post({ message: "nope" }, "not-a-uuid");
check("malformed api key returns 401", malformedKey.status === 401, String(malformedKey.status));

const emptyMessage = await post({ message: "" });
check("empty message returns 400", emptyMessage.status === 400, String(emptyMessage.status));
check("validation issues are returned", Array.isArray(emptyMessage.json?.issues));

const badJson = await post("{not json");
check("invalid JSON returns 400", badJson.status === 400, String(badJson.status));

// Rate limit: 10 requests/minute per IP. Invalid payloads still count, so this
// does not pollute the inbox. Any 429 within the burst is a pass.
let sawTooManyRequests = false;
for (let index = 0; index < 12; index += 1) {
  const response = await post({ message: "" });
  if (response.status === 429) {
    sawTooManyRequests = true;
    check("429 includes Retry-After", Boolean(response.headers.get("retry-after")));
    break;
  }
}
check("burst is rate limited", sawTooManyRequests);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll smoke checks passed.");
