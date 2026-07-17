"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { DashboardStats, Device, LiveUpdatePayload } from "@/types";

export function useSSE() {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: LiveUpdatePayload) => void>>>(new Map());

  useEffect(() => {
    const connect = () => {
      const eventSource = new EventSource("/api/sse");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => setConnected(true);
      eventSource.onerror = () => {
        setConnected(false);
        // EventSource will automatically try to reconnect, no need for setTimeout
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as LiveUpdatePayload;
          const listeners = listenersRef.current.get(payload.type);
          if (listeners) {
            listeners.forEach((listener) => listener(payload));
          }
        } catch (error) {
          console.error("Failed to parse SSE message", error);
        }
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const on = useCallback(<T extends LiveUpdatePayload>(
    type: string,
    handler: (data: T) => void
  ) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type)!.add(handler as any);
    return () => {
      listenersRef.current.get(type)?.delete(handler as any);
    };
  }, []);

  return { connected, on };
}

export function useDashboardLive(
  initialStats: DashboardStats,
  initialDevices: (Device & { uptimePercent?: number })[]
) {
  const [stats, setStats] = useState(initialStats);
  const [devices, setDevices] = useState(initialDevices);
  const { connected, on } = useSSE();
  const lastInitialStatsRef = useRef<DashboardStats>(initialStats);
  const lastInitialDevicesRef = useRef<typeof initialDevices>(initialDevices);
  const isUpdatingFromLiveRef = useRef(false); // To prevent loops when live updates are in effect

  // Update when initial props change
  useEffect(() => {
    if (isUpdatingFromLiveRef.current) {
      return;
    }

    // Simple deep-ish equality check for stats
    if (JSON.stringify(lastInitialStatsRef.current) !== JSON.stringify(initialStats)) {
      lastInitialStatsRef.current = initialStats;
      setStats(initialStats);
    }
    // Check for devices too
    if (JSON.stringify(lastInitialDevicesRef.current) !== JSON.stringify(initialDevices)) {
      lastInitialDevicesRef.current = initialDevices;
      setDevices(initialDevices);
    }
  }, [initialStats, initialDevices]);

  useEffect(() => {
    const unsubStats = on<LiveUpdatePayload & { type: "stats" }>("stats", (payload) => {
      if (payload.stats) setStats(payload.stats);
    });

    const unsubStatus = on<LiveUpdatePayload & { type: "status" }>("status", (payload) => {
      if (payload.devices) setDevices(payload.devices);
    });

    const unsubPing = on<LiveUpdatePayload & { type: "ping" }>("ping", (payload) => {
      if (payload.deviceId) {
        setDevices((prev) =>
          prev.map((device) =>
            device._id === payload.deviceId
              ? {
                  ...device,
                  status: payload.status || device.status,
                  lastPing: payload.latency ?? device.lastPing,
                  lastSeen: payload.latency !== null ? (payload.timestamp || null) : device.lastSeen,
                }
              : device
          )
        );
      }
    });

    return () => {
      unsubStats();
      unsubStatus();
      unsubPing();
    };
  }, [on]);

  return { stats, devices, connected };
}

export function useDeviceLive(deviceId: string) {
  const [device, setDevice] = useState<Device | null>(null);
  const [pingResults, setPingResults] = useState<
    { latency: number | null; status: string; timestamp: string }[]
  >([]);
  const { connected, on } = useSSE();

  useEffect(() => {
    const unsubStatus = on<LiveUpdatePayload & { type: "status" }>("status", (payload) => {
      if (payload.devices) {
        const found = payload.devices.find((d) => d._id === deviceId);
        if (found) setDevice(found);
      }
    });

    const unsubPing = on<LiveUpdatePayload & { type: "ping" }>("ping", (result) => {
      if (result.deviceId === deviceId) {
        setPingResults((prev) => [...prev.slice(-99), {
          latency: result.latency ?? null,
          status: result.status || "unknown",
          timestamp: result.timestamp || new Date().toISOString(),
        }]);
      }
    });

    return () => {
      unsubStatus();
      unsubPing();
    };
  }, [on, deviceId]);

  return { device, pingResults, connected, setDevice };
}

export function useAnimatedCounter(target: number | null | undefined, duration = 600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === null || target === undefined) return;
    const start = value;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + diff * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return Math.round(value * 10) / 10;
}
