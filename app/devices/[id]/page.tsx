"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Edit,
  Trash2,
  Activity,
  Clock,
  Gauge,
  Wifi,
  WifiOff,
  Server,
} from "lucide-react";
import { toast } from "sonner";
import {
  useDeviceDetails,
  useDeviceHistory,
  useDeviceEditHistory,
  deleteDevice,
  updateDevice,
} from "@/hooks/useDevices";
import { useDeviceLive, useAnimatedCounter } from "@/hooks/useSocket";
import { LatencyChart } from "@/components/charts/LatencyChart";
import { DeviceEditHistoryTable } from "@/components/devices/DeviceEditHistoryTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConnectionQualityBadge } from "@/components/ui/ConnectionQualityBadge";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/StatCard";
import { Button, Input, Checkbox, Label } from "@/components/ui/Button";
import {
  formatLatency,
  formatDuration,
  formatUptime,
  formatDate,
  exportToCSV,
  getConnectionQuality,
} from "@/utils";
import type { DeviceInput } from "@/lib/validations";

function AnimatedStatCard({
  title,
  value,
  icon,
  color,
  isLatency,
  subtitle,
}: {
  title: string;
  value: number | null | string;
  icon: any;
  color: "blue" | "green" | "red" | "purple";
  isLatency?: boolean;
  subtitle?: string;
}) {
  const animated = useAnimatedCounter(typeof value === "number" ? value : 0);
  const displayValue = isLatency
    ? formatLatency(animated)
    : typeof value === "string"
    ? value
    : animated;

  return (
    <StatCard
      title={title}
      value={displayValue}
      icon={icon}
      color={color}
      subtitle={subtitle}
    />
  );
}

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = params.id as string;
  const [showEdit, setShowEdit] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  const { data, loading, refresh } = useDeviceDetails(deviceId);
  const historyQuery = useMemo(() => ({
    page: historyPage,
    limit: 20,
  }), [historyPage]);
  const {
    result: historyResult,
    loading: historyLoading,
    refresh: refreshHistory,
  } = useDeviceHistory(deviceId, historyQuery);
  const editHistoryQuery = useMemo(() => ({
    page: 1,
    limit: 20,
  }), []);
  const { result: editHistoryResult, loading: editHistoryLoading, refresh: refreshEditHistory } =
    useDeviceEditHistory(deviceId, editHistoryQuery);
  const { device: liveDevice, pingResults, connected } = useDeviceLive(deviceId);

  const device = liveDevice || data?.device;

  const stats = data?.stats;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this device?")) return;
    try {
      await deleteDevice(deviceId);
      toast.success("Device deleted");
      router.push("/devices");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete device");
    }
  };

  const handleExportHistory = async () => {
    try {
      const res = await fetch(`/api/history/${deviceId}/export`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${device?.name || "device"}-history.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("History exported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export history");
    }
  };

  const EditForm = () => {
    const [formData, setFormData] = useState<DeviceInput>({
      name: device?.name || "",
      ip: device?.ip || "",
      email: device?.email || "",
      enabled: device?.enabled ?? true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await updateDevice(deviceId, formData);
        toast.success("Device updated");
        setShowEdit(false);
        refresh();
        refreshHistory();
        refreshEditHistory();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update device");
      }
    };

    return (
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-border bg-card p-6 mb-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ip">IP / Hostname</Label>
            <Input
              id="ip"
              value={formData.ip}
              onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="email">Alert Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="enabled"
              checked={formData.enabled}
              onChange={(e) =>
                setFormData({ ...formData, enabled: e.target.checked })
              }
            />
            <Label htmlFor="enabled">Enable Monitoring</Label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => setShowEdit(false)}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    );
  };

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="skeleton h-8 w-8 rounded" />
          <div className="skeleton h-8 w-48 rounded" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="skeleton h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Server className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Device Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The device you're looking for doesn't exist.
          </p>
          <Link href="/devices" className="mt-4 inline-block text-primary hover:underline">
            Back to Devices
          </Link>
        </div>
      </div>
    );
  }

  const allHistory = [...(data?.chartData || []), ...pingResults].slice(-100);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/devices"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{device.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-mono">{device.ip}</span>
              <span>•</span>
              <StatusBadge status={device.status} pulse={device.enabled} />
              <span>•</span>
              <ConnectionQualityBadge
                quality={getConnectionQuality(device.status, device.lastPing)}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportHistory}>
            <Download className="h-4 w-4" />
            Export History
          </Button>
          <Button variant="secondary" onClick={() => setShowEdit(!showEdit)}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="secondary" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      </div>

      {showEdit && <EditForm />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatedStatCard
          title="Current Status"
          value={device.status}
          icon={device.status === "online" ? Wifi : WifiOff}
          color={device.status === "online" ? "green" : "red"}
        />
        <AnimatedStatCard
          title="Current Latency"
          value={device.lastPing}
          icon={Activity}
          color="blue"
          isLatency
        />
        <AnimatedStatCard
          title="Average Latency"
          value={stats?.averageLatency ?? null}
          icon={Gauge}
          color="purple"
          isLatency
        />
        <AnimatedStatCard
          title="Uptime"
          value={formatUptime(stats?.uptimePercent || 100)}
          icon={Clock}
          color="green"
          subtitle={`${formatDuration(stats?.totalDowntimeMs || 0)} downtime`}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Latency History</h2>
          <LatencyChart data={data?.chartData || []} liveData={pingResults} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Last 100 Pings</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Latency
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allHistory
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <tr key={`${entry.timestamp}-${index}`} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(entry.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={entry.status} />
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">
                          {entry.status === "online" ? (
                            <span className="text-emerald-400">
                              {formatLatency(entry.latency)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  {allHistory.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                        No ping history yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Edit History</h2>
        <DeviceEditHistoryTable
          entries={editHistoryResult?.data ?? []}
          loading={editHistoryLoading}
        />
      </div>
    </div>
  );
}
