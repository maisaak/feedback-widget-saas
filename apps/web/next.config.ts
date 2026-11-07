import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@feedback-widget/ui", "@feedback-widget/database"],
  // PGlite ships WebAssembly and pg uses native-ish sockets: keep both outside
  // the server bundle. The embedded database is only used when DATABASE_URL
  // is not set.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
};

export default nextConfig;
