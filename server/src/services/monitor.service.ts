import { connectMongo } from "../db/mongoose.js";
import { EventModel, type MonitorEvent } from "../schema/event.js";
import { logger } from "../lib/logger.js";

export type { MonitorEvent };

/** Returns false (and logs a warning once) when MONGODB_URI isn't configured — callers should 503. */
export async function recordEvent(event: MonitorEvent): Promise<boolean> {
  const connecting = connectMongo();
  if (!connecting) {
    logger.warn("monitor:no_mongodb_uri");
    return false;
  }
  await connecting;
  await EventModel.create(event);
  return true;
}

export async function listRecentEvents(limit: number): Promise<MonitorEvent[]> {
  const connecting = connectMongo();
  if (!connecting) return [];
  await connecting;
  return EventModel.find().sort({ receivedAt: -1 }).limit(limit).lean();
}
