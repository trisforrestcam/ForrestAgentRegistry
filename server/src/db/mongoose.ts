import mongoose from "mongoose";
import { env } from "../config/env.js";

// Connection is opened lazily on first call so importing this module never requires
// MONGODB_URI to be set (e.g. running the MCP-only parts of the server without monitor).
let connectPromise: Promise<typeof mongoose> | undefined;

/** Returns undefined (no connection attempted) when MONGODB_URI isn't configured. */
export function connectMongo(): Promise<typeof mongoose> | undefined {
  if (!env.mongodbUri) return undefined;
  connectPromise ??= mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  return connectPromise;
}
