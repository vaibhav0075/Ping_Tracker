"use client";

import Link from "next/link";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConnectionQualityBadge } from "@/components/ui/ConnectionQualityBadge";
import {
  formatDate,
  formatLatency,
  formatUptime,
  cn,
  getConnectionQuality,
} from "@/utils";
import type { Device } from "@/types";

interface DeviceTableProps {
  devices: (Device & { uptimePercent?: number })[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (field: string) => void;
  loading?: boolean;
}

export function DeviceTable({
  devices,
  sortBy,
  sortOrder,
  onSort,
  loading,
}: DeviceTableProps) {
  const SortHeader = ({
    field,
    label,
  }: {
    field: string;
    label: string;
  }) => (
    <button
      onClick={() => onSort?.(field)}
      className="inline-flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
    >
      {label}
      <ArrowUpDown
        className={cn(
          "h-3 w-3",
          sortBy === field && "text-primary"
        )}
      />
      {sortBy === field && (
        <span className="sr-only">{sortOrder}</span>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card">
        <div className="p-8 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">No devices found</p>
        <Link
          href="/devices"
          className="mt-2 inline-block text-sm text-primary hover:underline"
        >
          Add your first device
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left">
                <SortHeader field="name" label="Device" />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader field="ip" label="IP" />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader field="status" label="Status" />
              </th>
              <th className="hidden px-4 py-3 text-left md:table-cell">
                Quality
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader field="lastPing" label="Latency" />
              </th>
              <th className="hidden px-4 py-3 text-left lg:table-cell">
                <SortHeader field="lastSeen" label="Last Seen" />
              </th>
              <th className="hidden px-4 py-3 text-left sm:table-cell">
                Uptime
              </th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {devices.map((device) => (
              <tr
                key={device._id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{device.name}</div>
                  {!device.enabled && (
                    <span className="text-xs text-muted-foreground">
                      Disabled
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                  {device.ip}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={device.status} pulse={device.enabled} />
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <ConnectionQualityBadge
                    quality={getConnectionQuality(
                      device.status,
                      device.lastPing
                    )}
                  />
                </td>
                <td className="px-4 py-3 font-mono text-sm">
                  {device.status === "online" ? (
                    <span className="text-emerald-400">
                      {formatLatency(device.lastPing)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
                  {formatDate(device.lastSeen)}
                </td>
                <td className="hidden px-4 py-3 text-sm sm:table-cell">
                  {formatUptime(device.uptimePercent ?? 100)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/devices/${device._id}`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Details
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
