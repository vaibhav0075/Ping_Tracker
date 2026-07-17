import mongoose, { Schema, Document, Model } from "mongoose";
import type { DeviceStatus } from "@/types";

export interface IDevice extends Document {
  name: string;
  ip: string;
  email: string;
  enabled: boolean;
  status: DeviceStatus;
  alertSent: boolean;
  lastAlertSentAt: Date | null;
  lastPing: number | null;
  lastSeen: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    name: { type: String, required: true, trim: true },
    ip: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    enabled: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["online", "offline", "unknown"],
      default: "unknown",
    },
    alertSent: { type: Boolean, default: false },
    lastAlertSentAt: { type: Date, default: null },
    lastPing: { type: Number, default: null },
    lastSeen: { type: Date, default: null },
  },
  { timestamps: true }
);

DeviceSchema.index({ enabled: 1, status: 1 });
DeviceSchema.index({ name: "text", ip: "text" });

export const Device: Model<IDevice> =
  mongoose.models.Device ?? mongoose.model<IDevice>("Device", DeviceSchema);

export function serializeDevice(doc: IDevice) {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    ip: doc.ip,
    email: doc.email,
    enabled: doc.enabled,
    status: doc.status,
    alertSent: doc.alertSent,
    lastAlertSentAt: doc.lastAlertSentAt?.toISOString() ?? null,
    lastPing: doc.lastPing,
    lastSeen: doc.lastSeen?.toISOString() ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
