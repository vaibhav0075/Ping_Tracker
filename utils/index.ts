import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export { getConnectionQuality } from "@/utils/helpers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLatency(latency: number | null): string {
  if (latency === null) return "—";
  return `${Math.round(latency)} ms`;
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

export function formatDate(date: string | Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString();
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string
): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        const str = val === null || val === undefined ? "" : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseSearchParams(
  searchParams: URLSearchParams
): Record<string, string> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "online":
      return "text-emerald-400";
    case "offline":
      return "text-red-400";
    default:
      return "text-amber-400";
  }
}

export function getStatusBg(status: string): string {
  switch (status) {
    case "online":
      return "bg-emerald-500/10 border-emerald-500/30";
    case "offline":
      return "bg-red-500/10 border-red-500/30";
    default:
      return "bg-amber-500/10 border-amber-500/30";
  }
}

export function getQualityColor(quality: string): string {
  switch (quality) {
    case "excellent":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "good":
      return "text-green-400 bg-green-500/10 border-green-500/30";
    case "fair":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "poor":
      return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    default:
      return "text-red-400 bg-red-500/10 border-red-500/30";
  }
}
