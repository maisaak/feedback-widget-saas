import { closeDb, ensureDemoWorkspace } from "./index";

const { user, project } = await ensureDemoWorkspace();

console.log("Seeded demo workspace");
console.log(`  user:    ${user.email}`);
console.log(`  project: ${project.name} (${project.id})`);
console.log(`  api key: ${project.apiKey}`);
console.log("\nEmbed snippet:");
console.log(`  <script src="/widget.js" data-api-key="${project.apiKey}" defer></script>`);

await closeDb();
