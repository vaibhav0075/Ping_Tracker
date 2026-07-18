import mongoose from "mongoose";
import { Device, serializeDevice, type IDevice } from "@/models/Device";
import { eventBus } from "@/lib/event-bus";

import {

  PingHistory,

  serializePingHistory,

  type IPingHistory,

} from "@/models/PingHistory";

import {

  DeviceEditHistory,

  serializeDeviceEditHistory,

} from "@/models/DeviceEditHistory";

import type {

  DashboardStats,

  DeviceDetailStats,

  DeviceEditHistoryEntry,

  DeviceQueryParams,

  DeviceWithStats,

  HistoryQueryParams,

  PaginatedResult,

  LiveUpdatePayload
} from "@/types";

import type { DeviceCreateInput, DeviceUpdateInput } from "@/lib/validations";

import {

  calculateDowntimeMs,

  calculateUptimePercent,

  latencyStats,

} from "@/utils/helpers";



const EDITABLE_FIELDS = ["name", "ip", "email", "enabled"] as const;



function buildDeviceFilter(userId: string, params: DeviceQueryParams) {

  const filter: Record<string, unknown> = { userId };



  if (params.search) {

    filter.$or = [

      { name: { $regex: params.search, $options: "i" } },

      { ip: { $regex: params.search, $options: "i" } },

    ];

  }



  if (params.status && params.status !== "all") {

    filter.status = params.status;

  }



  if (params.enabled !== "all" && params.enabled !== undefined) {

    filter.enabled = params.enabled;

  }



  return filter;

}



async function enrichDeviceWithStats(device: IDevice): Promise<DeviceWithStats> {

  const history = await PingHistory.find({ deviceId: device._id })

    .sort({ timestamp: -1 })

    .limit(100)

    .lean();



  const serialized = serializeDevice(device);

  const stats = latencyStats(history);

  const historyWithTimestamps = history.map((h) => ({

    status: h.status,

    timestamp: h.timestamp.toISOString(),

  }));



  return {

    ...serialized,

    uptimePercent: calculateUptimePercent(

      historyWithTimestamps,

      device.status,

      device.lastSeen?.toISOString()

    ),

    avgLatency: stats.avg,

    maxLatency: stats.max,

    minLatency: stats.min,

    totalDowntimeMs: calculateDowntimeMs(

      historyWithTimestamps,

      device.status,

      device.lastSeen?.toISOString()

    ),

  };

}



async function findOwnedDevice(userId: string, id: string) {

  return Device.findOne({ _id: id, userId });

}



function buildEditChanges(

  device: IDevice,

  input: DeviceUpdateInput

): { field: string; oldValue: unknown; newValue: unknown }[] {

  const changes: { field: string; oldValue: unknown; newValue: unknown }[] = [];



  for (const field of EDITABLE_FIELDS) {

    if (input[field] === undefined) continue;



    const oldValue = device[field];

    const newValue = input[field];



    if (oldValue !== newValue) {

      changes.push({ field, oldValue, newValue });

    }

  }



  return changes;

}



export async function getDevices(

  userId: string,

  params: DeviceQueryParams

): Promise<PaginatedResult<DeviceWithStats>> {

  const filter = buildDeviceFilter(userId, params);

  const sortField = params.sortBy || params.sort || "name";

  const sortOrderValue = params.sortOrder || params.order || "asc";

  const sortOrder = sortOrderValue === "desc" ? -1 : 1;

  const page = params.page ?? 1;

  const limit = params.limit ?? 10;

  const skip = (page - 1) * limit;



  const [devices, total] = await Promise.all([

    Device.find(filter).sort({ [sortField]: sortOrder }).skip(skip).limit(limit),

    Device.countDocuments(filter),

  ]);



  const enriched = await Promise.all(devices.map(enrichDeviceWithStats));



  return {

    data: enriched,

    total,

    page,

    limit,

    totalPages: Math.ceil(total / limit) || 1,

  };

}



export async function getAllDevicesForDashboard(

  userId: string

): Promise<DeviceWithStats[]> {

  const devices = await Device.find({ userId }).sort({ name: 1 });

  return Promise.all(devices.map(enrichDeviceWithStats));

}



export async function getDeviceById(userId: string, id: string) {

  const device = await findOwnedDevice(userId, id);

  if (!device) return null;

  return enrichDeviceWithStats(device);

}



export async function createDevice(userId: string, input: DeviceCreateInput) {
  const device = await Device.create({
    ...input,
    userId,
    status: "unknown",
    alertSent: false,
    lastPing: null,
    lastSeen: null,
  });
  const enriched = await enrichDeviceWithStats(device);
  
  // Publish device created event
  eventBus.publish({
    type: "device:created",
    device: serializeDevice(device),
    timestamp: new Date().toISOString(),
  });

  return enriched;
}

export async function updateDevice(
  userId: string,
  id: string,
  input: DeviceUpdateInput
) {
  const device = await findOwnedDevice(userId, id);
  if (!device) return null;

  const changes = buildEditChanges(device, input);

  if (changes.length > 0) {
    await DeviceEditHistory.create({
      deviceId: device._id,
      userId,
      changes,
    });
  }

  Object.assign(device, input);
  await device.save();
  const enriched = await enrichDeviceWithStats(device);

  // Publish device updated event
  eventBus.publish({
    type: "device:updated",
    deviceId: device._id.toString(),
    device: serializeDevice(device),
    timestamp: new Date().toISOString(),
  });

  return enriched;
}

export async function deleteDevice(userId: string, id: string): Promise<boolean> {
  const device = await findOwnedDevice(userId, id);
  if (!device) return false;

  await Promise.all([
    PingHistory.deleteMany({ deviceId: id }),
    DeviceEditHistory.deleteMany({ deviceId: id }),
    Device.deleteOne({ _id: id, userId }),
  ]);

  // Publish device deleted event
  eventBus.publish({
    type: "device:deleted",
    deviceId: id,
    timestamp: new Date().toISOString(),
  });

  return true;
}



export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const filter = { userId };

  const [totalDevices, online, offline, latencyAgg] = await Promise.all([
    Device.countDocuments(filter),
    Device.countDocuments({ ...filter, status: "online" }),
    Device.countDocuments({ ...filter, status: "offline" }),
    Device.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: "online",
          lastPing: { $ne: null },
        },
      },
      { $group: { _id: null, avg: { $avg: "$lastPing" } } },
    ]),
  ]);

  return {
    totalDevices,
    online,
    offline,
    averageLatency: latencyAgg[0]?.avg ?? null,
  };
}

export async function getGlobalDashboardStats(): Promise<DashboardStats> {
  const [totalDevices, online, offline, latencyAgg] = await Promise.all([
    Device.countDocuments(),
    Device.countDocuments({ status: "online" }),
    Device.countDocuments({ status: "offline" }),
    Device.aggregate([
      { $match: { status: "online", lastPing: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$lastPing" } } },
    ]),
  ]);

  return {
    totalDevices,
    online,
    offline,
    averageLatency: latencyAgg[0]?.avg ?? null,
  };
}



export async function getDeviceHistory(

  userId: string,

  deviceId: string,

  params: HistoryQueryParams

): Promise<PaginatedResult<ReturnType<typeof serializePingHistory>>> {

  const device = await findOwnedDevice(userId, deviceId);

  if (!device) {

    return { data: [], total: 0, page: 1, limit: params.limit ?? 100, totalPages: 0 };

  }



  const filter: Record<string, unknown> = { deviceId };

  if (params.status) filter.status = params.status;



  const sortField = params.sortBy || params.sort || "timestamp";

  const sortOrderValue = params.sortOrder || params.order || "desc";

  const sortOrder = sortOrderValue === "asc" ? 1 : -1;

  const page = params.page ?? 1;

  const limit = params.limit ?? 100;

  const skip = (page - 1) * limit;



  const [history, total] = await Promise.all([

    PingHistory.find(filter)

      .sort({ [sortField]: sortOrder })

      .skip(skip)

      .limit(limit),

    PingHistory.countDocuments(filter),

  ]);



  return {

    data: history.map(serializePingHistory),

    total,

    page,

    limit,

    totalPages: Math.ceil(total / limit) || 1,

  };

}



export async function getDeviceDetail(

  userId: string,

  deviceId: string

): Promise<DeviceDetailStats | null> {

  const device = await findOwnedDevice(userId, deviceId);

  if (!device) return null;



  const history = await PingHistory.find({ deviceId })

    .sort({ timestamp: -1 })

    .limit(100);



  const stats = latencyStats(history);

  const historyWithTimestamps = history.map((h) => ({

    status: h.status,

    timestamp: h.timestamp.toISOString(),

  }));



  return {

    device: serializeDevice(device),

    uptimePercent: calculateUptimePercent(

      historyWithTimestamps,

      device.status,

      device.lastSeen?.toISOString()

    ),

    averageLatency: stats.avg,

    maxLatency: stats.max,

    minLatency: stats.min,

    totalDowntimeMs: calculateDowntimeMs(

      historyWithTimestamps,

      device.status,

      device.lastSeen?.toISOString()

    ),

    history: history.map(serializePingHistory),

  };

}



export async function getHistoryForExport(userId: string, deviceId: string) {

  const device = await findOwnedDevice(userId, deviceId);

  if (!device) return null;



  const history = await PingHistory.find({ deviceId })

    .sort({ timestamp: -1 })

    .limit(1000);



  return {

    deviceName: device.name,

    history: history.map(serializePingHistory),

  };

}



export async function getDeviceEditHistory(

  userId: string,

  deviceId: string,

  params: { page?: number; limit?: number } = {}

): Promise<PaginatedResult<DeviceEditHistoryEntry>> {

  const device = await findOwnedDevice(userId, deviceId);

  if (!device) {

    return { data: [], total: 0, page: 1, limit: params.limit ?? 20, totalPages: 0 };

  }



  const page = params.page ?? 1;

  const limit = params.limit ?? 20;

  const skip = (page - 1) * limit;



  const [entries, total] = await Promise.all([

    DeviceEditHistory.find({ deviceId })

      .sort({ createdAt: -1 })

      .skip(skip)

      .limit(limit)

      .populate("userId", "name"),

    DeviceEditHistory.countDocuments({ deviceId }),

  ]);



  return {

    data: entries.map((entry) => {

      const populatedUser = entry.userId as unknown as { name?: string } | string;

      const userName =

        typeof populatedUser === "object" && populatedUser?.name

          ? populatedUser.name

          : undefined;



      return serializeDeviceEditHistory(entry, userName);

    }),

    total,

    page,

    limit,

    totalPages: Math.ceil(total / limit) || 1,

  };

}



export async function recordPingResult(

  device: IDevice,

  alive: boolean,

  latency: number | null

): Promise<{ device: IDevice; history: IPingHistory }> {

  const now = new Date();

  const status = alive ? "online" : "offline";



  device.status = status;

  device.lastPing = alive ? latency : device.lastPing;

  if (alive) {

    device.lastSeen = now;

  }

  await device.save();



  const history = await PingHistory.create({

    deviceId: device._id,

    latency: alive ? latency : null,

    status,

    timestamp: now,

  });



  return { device, history };

}



export async function cleanupOldHistory(retentionDays: number): Promise<number> {

  const cutoff = new Date();

  cutoff.setDate(cutoff.getDate() - retentionDays);

  const result = await PingHistory.deleteMany({ timestamp: { $lt: cutoff } });

  return result.deletedCount ?? 0;

}


