import { existsSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { findWorkspaceRoot } from "./paths";

// Load env files from the workspace root and from this package. Paths are
// resolved at runtime — bundlers must not try to statically resolve them.
const root = findWorkspaceRoot();
for (const dir of [root, path.resolve(root, "packages/database")]) {
  for (const file of [".env", ".env.local"]) {
    const envPath = path.join(dir, file);
    if (existsSync(envPath)) config({ path: envPath });
  }
}

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required for a hosted Postgres. Leave it unset to use the embedded PGlite database for local development.",
    );
  }
  return url;
}
