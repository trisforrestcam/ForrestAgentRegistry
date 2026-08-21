// Centralizes process.env access so every other module reads config from one place
// instead of scattering process.env.X reads across services/routes.
export const env = {
  port: Number(process.env.PORT ?? 8787),
  logLevel: process.env.LOG_LEVEL ?? "info",
  skillsPath: process.env.SKILLS_PATH,
  mongodbUri: process.env.MONGODB_URI,
  mongodbDb: process.env.MONGODB_DB ?? "skill_registry_monitor",
};
