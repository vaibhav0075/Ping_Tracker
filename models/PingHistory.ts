import mongoose, { Schema, Document, Model } from "mongoose";
import type { DeviceStatus } from "@/types";

export interface IPingHistory extends Document {
  deviceId: mongoose.Types.ObjectId;
  latency: number | null;
  status: DeviceStatus;
  timestamp: Date;
}

const PingHistorySchema = new Schema<IPingHistory>(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
      index: true,
    },
    latency: { type: Number, default: null },
    status: {
      type: String,
      enum: ["online", "offline", "unknown"],
      required: true,
    },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

PingHistorySchema.index({ deviceId: 1, timestamp: -1 });

export const PingHistory: Model<IPingHistory> =
  mongoose.models.PingHistory ??
  mongoose.model<IPingHistory>("PingHistory", PingHistorySchema);

export function serializePingHistory(doc: IPingHistory) {
  return {
    _id: doc._id.toString(),
    deviceId: doc.deviceId.toString(),
    latency: doc.latency,
    status: doc.status,
    timestamp: doc.timestamp.toISOString(),
  };
}
