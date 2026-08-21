import path from "node:path";
import express from "express";
import { apiRouter } from "./routes/index.js";
import { handleMcpRequest } from "./mcp/handler.js";
import { logger } from "./lib/logger.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      logger.info({ method: req.method, path: req.path, status: res.statusCode, ms: Math.round(ms) }, "http");
    });
    next();
  });

  app.use("/api", apiRouter);
  app.all("/mcp", handleMcpRequest);

  app.use(express.static(path.join(import.meta.dirname, "../public")));

  return app;
}
