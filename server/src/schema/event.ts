import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const eventSchema = new Schema(
  {
    source: { type: String, enum: ["claude-code", "opencode"], required: true },
    sessionId: String,
    reason: String,
    cwd: String,
    summary: Schema.Types.Mixed,
  },
  { strict: false, timestamps: { createdAt: "receivedAt", updatedAt: false } },
);

export type MonitorEvent = InferSchemaType<typeof eventSchema>;

export const EventModel = mongoose.model<MonitorEvent>("Event", eventSchema);
