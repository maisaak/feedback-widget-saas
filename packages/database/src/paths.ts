import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Locates the monorepo root so every process (Next.js in apps/web, CLI seeds
 * in packages/database) resolves the same `.env` and embedded database files.
 */
export function findWorkspaceRoot(): string {
  let current = process.cwd();
  for (let depth = 0; depth < 8; depth += 1) {
    if (existsSync(path.join(current, "pnpm-workspace.yaml"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return process.cwd();
}
