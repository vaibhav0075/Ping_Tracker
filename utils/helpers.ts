import type { ConnectionQuality, DeviceStatus } from "@/types";
import ExcelJS from "exceljs";

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

  if (history.length > 0) {
    const sortedHistory = [...history].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

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

  if (currentStatus === "offline" && lastSeen) {
    const lastSeenDate = new Date(lastSeen);
    const ongoingTime = now.getTime() - lastSeenDate.getTime();
    totalTime += ongoingTime;
  }

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

  if (history.length > 0) {
    const sortedHistory = [...history].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 1; i < sortedHistory.length; i++) {
      const prev = sortedHistory[i - 1];
      const curr = sortedHistory[i];
      const timeDiff = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
      if (prev.status === "offline") {
        totalDowntime += timeDiff;
      }
    }
  }

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

export async function exportReportToExcel(
  reportData: {
    device: any;
    uptimePercent: number;
    totalDowntimeMs: number;
    averageLatency: number | null;
    maxLatency: number | null;
    minLatency: number | null;
    history: any[];
  }[],
  reportType: "summary" | "detailed" | "both" = "both"
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();

  if (reportType === "summary" || reportType === "both") {
    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.columns = [
      { header: "Device Name", key: "name", width: 20 },
      { header: "Device IP", key: "ip", width: 15 },
      { header: "Uptime %", key: "uptime", width: 12 },
      { header: "Total Downtime", key: "downtime", width: 15 },
      { header: "Avg Latency (ms)", key: "avgLatency", width: 15 },
      { header: "Min Latency (ms)", key: "minLatency", width: 15 },
      { header: "Max Latency (ms)", key: "maxLatency", width: 15 },
    ];

    reportData.forEach((d) => {
      summarySheet.addRow({
        name: d.device.name,
        ip: d.device.ip,
        uptime: `${d.uptimePercent.toFixed(2)}%`,
        downtime: formatDuration(d.totalDowntimeMs),
        avgLatency: d.averageLatency,
        minLatency: d.minLatency,
        maxLatency: d.maxLatency,
      });
    });
  }

  if (reportType === "detailed" || reportType === "both") {
    const detailedSheet = workbook.addWorksheet("Detailed");
    detailedSheet.columns = [
      { header: "Device Name", key: "name", width: 20 },
      { header: "Device IP", key: "ip", width: 15 },
      { header: "Timestamp", key: "timestamp", width: 25 },
      { header: "Status", key: "status", width: 12 },
      { header: "Latency (ms)", key: "latency", width: 15 },
    ];

    reportData.forEach((d) => {
      d.history.forEach((h) => {
        detailedSheet.addRow({
          name: d.device.name,
          ip: d.device.ip,
          timestamp: new Date(h.timestamp).toLocaleString(),
          status: h.status,
          latency: h.latency,
        });
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

export function exportReportToCsv(
  reportData: {
    device: any;
    uptimePercent: number;
    totalDowntimeMs: number;
    averageLatency: number | null;
    maxLatency: number | null;
    minLatency: number | null;
    history: any[];
  }[],
  reportType: "summary" | "detailed" | "both" = "both"
): string {
  let csv = "";

  if (reportType === "summary" || reportType === "both") {
    csv += "Type,Device Name,Device IP,Uptime %,Total Downtime,Avg Latency (ms),Min Latency (ms),Max Latency (ms)\n";
    reportData.forEach((d) => {
      csv += `"Summary","${d.device.name}","${d.device.ip}","${d.uptimePercent.toFixed(2)}%","${formatDuration(d.totalDowntimeMs)}","${d.averageLatency ?? ''}","${d.minLatency ?? ''}","${d.maxLatency ?? ''}"\n`;
    });
    csv += "\n";
  }

  if (reportType === "detailed" || reportType === "both") {
    csv += "Type,Device Name,Device IP,Uptime %,Total Downtime,Avg Latency (ms),Min Latency (ms),Max Latency (ms),Timestamp,Status,Latency (ms)\n";
    const body = reportData
      .flatMap((d) =>
        d.history.length > 0 ?
          d.history.map((h) =>
            `"Detailed","${d.device.name}","${d.device.ip}","${d.uptimePercent.toFixed(2)}%","${formatDuration(d.totalDowntimeMs)}","${d.averageLatency ?? ''}","${d.minLatency ?? ''}","${d.maxLatency ?? ''}","${h.timestamp}","${h.status}","${h.latency ?? ''}"`
          )
          : [
            `"Detailed","${d.device.name}","${d.device.ip}","${d.uptimePercent.toFixed(2)}%","${formatDuration(d.totalDowntimeMs)}","${d.averageLatency ?? ''}","${d.minLatency ?? ''}","${d.maxLatency ?? ''}","","",""`
          ]
      )
      .join("\n");
    csv += body;
  }

  return csv;
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
