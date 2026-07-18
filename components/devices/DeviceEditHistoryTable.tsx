"use client";

import { History } from "lucide-react";
import { formatDate } from "@/utils";
import type { DeviceEditHistoryEntry } from "@/types";

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  ip: "IP / Hostname",
  email: "Alert Email",
  enabled: "Monitoring",
};

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (field === "enabled") return value ? "Enabled" : "Disabled";
  return String(value);
}

interface DeviceEditHistoryTableProps {
  entries: DeviceEditHistoryEntry[];
  loading?: boolean;
}

export function DeviceEditHistoryTable({
  entries,
  loading,
}: DeviceEditHistoryTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <History className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          No edit history yet. Changes to this device will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="divide-y divide-border">
        {entries.map((entry) => (
          <div key={entry._id} className="p-4 hover:bg-muted/30">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium">
                {entry.userName || "Unknown user"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(entry.createdAt)}
              </p>
            </div>
            <ul className="mt-2 space-y-1">
              {entry.changes.map((change, index) => (
                <li key={`${entry._id}-${change.field}-${index}`} className="text-sm">
                  <span className="text-muted-foreground">
                    {FIELD_LABELS[change.field] || change.field}:
                  </span>{" "}
                  <span className="text-red-400/80 line-through">
                    {formatValue(change.field, change.oldValue)}
                  </span>{" "}
                  <span className="text-muted-foreground">→</span>{" "}
                  <span className="text-emerald-400">
                    {formatValue(change.field, change.newValue)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
