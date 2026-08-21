import { Router } from "express";
import { listRecentEvents, recordEvent, type MonitorEvent } from "../services/monitor.service.js";

export const monitorRouter = Router();

// Mounted at /api/monitor — paths below are relative to that.
monitorRouter.post("/events", async (req, res) => {
  const body = req.body as Partial<MonitorEvent>;
  if (body.source !== "claude-code" && body.source !== "opencode") {
    res.status(400).json({ error: "source must be 'claude-code' or 'opencode'" });
    return;
  }
  const ok = await recordEvent(body as MonitorEvent);
  if (!ok) {
    res.status(503).json({ error: "monitor storage not configured (MONGODB_URI unset)" });
    return;
  }
  res.status(204).end();
});

monitorRouter.get("/events", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const events = await listRecentEvents(limit);
  res.json({ events });
});
