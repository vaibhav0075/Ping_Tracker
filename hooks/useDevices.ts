"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  DashboardStats,
  Device,
  DeviceEditHistoryEntry,
  DeviceQuery,
  HistoryQuery,
  PaginatedResult,
  PingHistoryEntry,
} from "@/types";
import type { DeviceInput, DeviceUpdateInput } from "@/lib/validations";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== "") search.set(key, String(val));
  });
  return search.toString();
}

export function useDashboard() {
  const [data, setData] = useState<{
    stats: DashboardStats;
    devices: (Device & { uptimePercent: number })[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async ({ setLoadingState } = { setLoadingState: true }) => {
    try {
      if (setLoadingState) setLoading(true);
      const result = await fetchJSON<{
        stats: DashboardStats;
        devices: (Device & { uptimePercent: number })[];
      }>("/api/dashboard");
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      if (setLoadingState) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useDevices(query: DeviceQuery) {
  const [result, setResult] = useState<PaginatedResult<
    Device & { uptimePercent: number }
  > | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async ({ setLoadingState } = { setLoadingState: true }) => {
    if (setLoadingState) setLoading(true);
    try {
      const qs = buildQuery(query as Record<string, string | number | boolean | undefined>);
      const data = await fetchJSON<PaginatedResult<Device & { uptimePercent: number }>>(
        `/api/devices?${qs}`
      );
      setResult(data);
    } finally {
      if (setLoadingState) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { result, loading, refresh };
}

export async function createDevice(input: DeviceInput): Promise<Device> {
  return fetchJSON<Device>("/api/devices", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateDevice(
  id: string,
  input: DeviceUpdateInput
): Promise<Device> {
  return fetchJSON<Device>(`/api/devices/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteDevice(id: string): Promise<void> {
  await fetchJSON(`/api/devices/${id}`, { method: "DELETE" });
}

export function useDeviceDetails(deviceId: string) {
  const [data, setData] = useState<{
    device: Device;
    chartData: PingHistoryEntry[];
    stats: {
      averageLatency: number | null;
      minLatency: number | null;
      maxLatency: number | null;
      uptimePercent: number;
      totalDowntimeMs: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async ({ setLoadingState } = { setLoadingState: true }) => {
    if (setLoadingState) setLoading(true);
    try {
      const result = await fetchJSON<{
        device: Device;
        uptimePercent: number;
        averageLatency: number | null;
        maxLatency: number | null;
        minLatency: number | null;
        totalDowntimeMs: number;
        history: PingHistoryEntry[];
      }>(`/api/devices/${deviceId}/detail`);
      setData({
        device: result.device,
        chartData: result.history,
        stats: {
          averageLatency: result.averageLatency,
          minLatency: result.minLatency,
          maxLatency: result.maxLatency,
          uptimePercent: result.uptimePercent,
          totalDowntimeMs: result.totalDowntimeMs,
        },
      });
    } finally {
      if (setLoadingState) setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}

export function useDeviceHistory(deviceId: string, query: HistoryQuery) {
  const [result, setResult] = useState<PaginatedResult<PingHistoryEntry> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async ({ setLoadingState } = { setLoadingState: true }) => {
    if (setLoadingState) setLoading(true);
    try {
      const qs = buildQuery(query as Record<string, string | number | boolean | undefined>);
      const data = await fetchJSON<PaginatedResult<PingHistoryEntry>>(
        `/api/history/${deviceId}?${qs}`
      );
      setResult(data);
    } finally {
      if (setLoadingState) setLoading(false);
    }
  }, [deviceId, query]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { result, loading, refresh };
}

export function useDeviceEditHistory(
  deviceId: string,
  query: { page?: number; limit?: number } = {}
) {
  const [result, setResult] = useState<PaginatedResult<DeviceEditHistoryEntry> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQuery(query as Record<string, string | number | boolean | undefined>);
      const data = await fetchJSON<PaginatedResult<DeviceEditHistoryEntry>>(
        `/api/devices/${deviceId}/edit-history?${qs}`
      );
      setResult(data);
    } finally {
      setLoading(false);
    }
  }, [deviceId, query]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { result, loading, refresh };
}
