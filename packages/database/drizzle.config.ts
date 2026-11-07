import { defineConfig } from "drizzle-kit";

// drizzle-kit only needs real credentials for push/studio/migrate.
// `generate` works fully offline, which keeps the repo usable without a DB.
export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgres://localhost:5432/placeholder" },
});
