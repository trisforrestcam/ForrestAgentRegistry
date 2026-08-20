import path from "node:path";
import express from "express";
import { restRouter } from "./rest.js";
import { handleMcpRequest } from "./mcp.js";
import { logger } from "./logger.js";

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

app.use("/api", restRouter);
app.all("/mcp", handleMcpRequest);

app.use(express.static(path.join(import.meta.dirname, "../public")));

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  logger.info(`skill-registry listening on http://localhost:${port}`);
});
