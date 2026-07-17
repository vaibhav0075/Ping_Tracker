import type { ConnectionQuality, DeviceStatus } from "@/types";

export function formatLatency(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  return `${Math.round(ms)} ms`;
}

export function formatUptime(percent: number): string {
  return `${percent.toFixed(2)}%`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function getConnectionQuality(
  status: DeviceStatus,
  latency: number | null
): ConnectionQuality {
  if (status === "offline") return "offline";
  if (status === "unknown" || latency === null) return "fair";
  if (latency < 30) return "excellent";
  if (latency < 80) return "good";
  if (latency < 150) return "fair";
  return "poor";
}

export function connectionQualityLabel(quality: ConnectionQuality): string {
  const labels: Record<ConnectionQuality, string> = {
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
    offline: "Offline",
  };
  return labels[quality];
}

export function connectionQualityColor(quality: ConnectionQuality): string {
  const colors: Record<ConnectionQuality, string> = {
    excellent: "text-emerald-400",
    good: "text-green-400",
    fair: "text-yellow-400",
    poor: "text-orange-400",
    offline: "text-red-400",
  };
  return colors[quality];
}

export function statusColor(status: DeviceStatus): string {
  switch (status) {
    case "online":
      return "text-emerald-400";
    case "offline":
      return "text-red-400";
    default:
      return "text-zinc-400";
  }
}

export function statusBgColor(status: DeviceStatus): string {
  switch (status) {
    case "online":
      return "bg-emerald-500/20 border-emerald-500/30";
    case "offline":
      return "bg-red-500/20 border-red-500/30";
    default:
      return "bg-zinc-500/20 border-zinc-500/30";
  }
}

export function calculateUptimePercent(
  history: { status: DeviceStatus; timestamp: string }[],
  currentStatus?: DeviceStatus,
  lastSeen?: string | null
): number {
  const now = new Date();
  let totalTime = 0;
  let onlineTime = 0;

  // First handle existing history
  if (history.length > 0) {
    // Sort history from oldest to newest to calculate time gaps
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculate time between each history entry
    for (let i = 1; i < sortedHistory.length; i++) {
      const prev = sortedHistory[i - 1];
      const curr = sortedHistory[i];
      const timeDiff = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
      totalTime += timeDiff;
      if (prev.status === "online") {
        onlineTime += timeDiff;
      }
    }
  }

  // Add ongoing time if device is currently offline
  if (currentStatus === "offline" && lastSeen) {
    const lastSeenDate = new Date(lastSeen);
    const ongoingTime = now.getTime() - lastSeenDate.getTime();
    totalTime += ongoingTime;
    // No online time added for ongoing offline
  }

  // If no time data, return 100%
  if (totalTime === 0) return 100;

  return (onlineTime / totalTime) * 100;
}

export function calculateDowntimeMs(
  history: { status: DeviceStatus; timestamp: string }[],
  currentStatus?: DeviceStatus,
  lastSeen?: string | null
): number {
  const now = new Date();
  let totalDowntime = 0;

  // Calculate downtime from history
  if (history.length > 0) {
    // Sort history from oldest to newest
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculate time between each history entry for offline periods
    for (let i = 1; i < sortedHistory.length; i++) {
      const prev = sortedHistory[i - 1];
      const curr = sortedHistory[i];
      const timeDiff = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
      if (prev.status === "offline") {
        totalDowntime += timeDiff;
      }
    }
  }

  // Add ongoing downtime if device is still offline
  if (currentStatus === "offline" && lastSeen) {
    const lastSeenDate = new Date(lastSeen);
    totalDowntime += now.getTime() - lastSeenDate.getTime();
  }

  return totalDowntime;
}

export function latencyStats(history: { latency: number | null }[]) {
  const latencies = history
    .map((h) => h.latency)
    .filter((l): l is number => l !== null);

  if (latencies.length === 0) {
    return { avg: null, min: null, max: null };
  }

  return {
    avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    min: Math.min(...latencies),
    max: Math.max(...latencies),
  };
}

export function exportHistoryToCsv(
  rows: {
    timestamp: string;
    status: string;
    latency: number | null;
  }[],
  deviceName: string
): string {
  const header = "Device,Timestamp,Status,Latency (ms)\n";
  const body = rows
    .map(
      (r) =>
        `"${deviceName}","${r.timestamp}","${r.status}","${r.latency ?? ""}"`
    )
    .join("\n");
  return header + body;
}

export async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}
