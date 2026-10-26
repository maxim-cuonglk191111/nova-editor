// Bundle entry for scripts/seed-demo.mjs. The script reuses the app's own code (project
// builder, migration, serializer, password hashing) instead of copying it, so a seeded account
// and project are exactly what the app itself would have written.
export { DEMO_SITES, buildProjectSchema } from "./demoProjects";
export { hashPassword } from "../password";
export { migrateToLatest } from "../migrate";
export { serializeWebstudioData } from "../schema";
