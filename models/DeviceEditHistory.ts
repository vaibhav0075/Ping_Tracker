import mongoose, { Schema, model, Document } from "mongoose";

export interface IDeviceEditHistory extends Document {
  deviceId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  createdAt: Date;
}

const DeviceEditHistorySchema = new Schema<IDeviceEditHistory>(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changes: [
      {
        field: { type: String, required: true },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed },
      },
    ],
  },
  { timestamps: true }
);

DeviceEditHistorySchema.index({ deviceId: 1, createdAt: -1 });

export function serializeDeviceEditHistory(
  doc: IDeviceEditHistory,
  userName?: string
) {
  const rawUserId = doc.userId as unknown;
  const userId =
    typeof rawUserId === "object" &&
    rawUserId !== null &&
    "_id" in (rawUserId as object)
      ? String((rawUserId as { _id: unknown })._id)
      : String(doc.userId);

  return {
    _id: doc._id.toString(),
    deviceId: doc.deviceId.toString(),
    userId,
    userName,
    changes: doc.changes.map((change) => ({
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
    })),
    createdAt: doc.createdAt.toISOString(),
  };
}

export const DeviceEditHistory =
  mongoose.models.DeviceEditHistory ||
  model<IDeviceEditHistory>("DeviceEditHistory", DeviceEditHistorySchema);
