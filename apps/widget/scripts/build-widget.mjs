import { build } from "tsup";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const widgetDir = fileURLToPath(new URL("../", import.meta.url));
process.chdir(widgetDir);
await build({ entry: ["src/index.ts"], format: ["esm"], dts: true, minify: true, clean: true, outDir: "dist", target: "es2022" });
const publicDir = path.resolve(widgetDir, "../web/public");
await mkdir(publicDir, { recursive: true });
await writeFile(path.join(publicDir, ".gitkeep"), "", { flag: "a" });
await build({ entry: { widget: "src/index.ts" }, format: ["iife"], globalName: "FeedbackWidget", minify: true, outDir: publicDir, clean: false, target: "es2020", outExtension: () => ({ js: ".js" }) });
