export type DeviceStatus = "online" | "offline" | "unknown";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Device {
  _id: string;
  userId: string;
  name: string;
  ip: string;
  email: string;
  enabled: boolean;
  status: DeviceStatus;
  alertSent: boolean;
  lastPing: number | null;
  lastSeen: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PingHistoryEntry {
  _id: string;
  deviceId: string;
  latency: number | null;
  status: DeviceStatus;
  timestamp: string;
}

export interface DeviceEditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface DeviceEditHistoryEntry {
  _id: string;
  deviceId: string;
  userId: string;
  userName?: string;
  changes: DeviceEditChange[];
  createdAt: string;
}

export interface DashboardStats {
  totalDevices: number;
  online: number;
  offline: number;
  averageLatency: number | null;
}

export interface DeviceWithStats extends Device {
  uptimePercent: number;
  avgLatency: number | null;
  maxLatency: number | null;
  minLatency: number | null;
  totalDowntimeMs: number;
}

export interface DeviceDetailStats {
  device: Device;
  uptimePercent: number;
  averageLatency: number | null;
  maxLatency: number | null;
  minLatency: number | null;
  totalDowntimeMs: number;
  history: PingHistoryEntry[];
}

export interface LiveUpdatePayload {
  type: "status" | "stats" | "ping";
  devices?: Device[];
  stats?: DashboardStats;
  deviceId?: string;
  latency?: number | null;
  status?: DeviceStatus;
  timestamp?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HistoryQueryParams {
  page?: number;
  limit?: number;
  status?: DeviceStatus;
  sort?: "timestamp" | "latency";
  order?: "asc" | "desc";
  sortBy?: "timestamp" | "latency";
  sortOrder?: "asc" | "desc";
}

// Alias for compatibility with hooks
export type HistoryQuery = HistoryQueryParams;

export interface DeviceQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: DeviceStatus | "all";
  enabled?: boolean | "all";
  sort?: "name" | "ip" | "status" | "lastPing" | "lastSeen" | "createdAt";
  order?: "asc" | "desc";
  sortBy?: "name" | "ip" | "status" | "lastPing" | "lastSeen" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface DeviceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: DeviceStatus | "all";
  enabled?: boolean | "all";
  sort?: "name" | "ip" | "status" | "lastPing" | "lastSeen" | "createdAt";
  order?: "asc" | "desc";
  sortBy?: "name" | "ip" | "status" | "lastPing" | "lastSeen" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export type ConnectionQuality = "excellent" | "good" | "fair" | "poor" | "offline";
