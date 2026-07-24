"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { DeviceForm } from "@/components/devices/DeviceForm";
import { DeviceTable } from "@/components/devices/DeviceTable";
import { SearchFilterBar, Pagination } from "@/components/ui/SearchFilterBar";
import { Button } from "@/components/ui/Button";
import {
  useDevices,
  createDevice,
  updateDevice,
  deleteDevice,
} from "@/hooks/useDevices";
import { useDashboardLive } from "@/hooks/useSocket";
import type { DeviceInput } from "@/lib/validations";
import type { Device } from "@/types";
import { exportToCSV } from "@/utils";

export default function DevicesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [enabledFilter, setEnabledFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<
    "name" | "ip" | "status" | "lastPing" | "lastSeen" | "createdAt"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const query = useMemo(() => ({
    page,
    limit: 10,
    search: search || undefined,
    status: (statusFilter || undefined) as "online" | "offline" | "unknown" | undefined,
    enabled: enabledFilter === "" ? undefined : enabledFilter === "true",
    sortBy,
    sortOrder,
  }), [page, search, statusFilter, enabledFilter, sortBy, sortOrder]);

  const { result, loading, refresh } = useDevices(query);
  const live = useDashboardLive(
    { totalDevices: 0, online: 0, offline: 0, averageLatency: 0 },
    result?.data ?? []
  );

  const handleSort = useCallback(
    (field: string) => {
      if (sortBy === field) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field as typeof sortBy);
        setSortOrder("asc");
      }
    },
    [sortBy]
  );

  const handleSubmit = async (data: DeviceInput) => {
    try {
      if (editingDevice) {
        await updateDevice(editingDevice._id, data);
        toast.success("Device updated");
      } else {
        await createDevice(data);
        toast.success("Device created");
      }
      setShowForm(false);
      setEditingDevice(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save device");
    }
  };

  const handleDelete = async (device: Device) => {
    if (!confirm(`Delete ${device.name}?`)) return;
    try {
      await deleteDevice(device._id);
      toast.success("Device deleted");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete device");
    }
  };

  const handleExport = () => {
    const devices = live.devices.length > 0 ? live.devices : result?.data ?? [];
    exportToCSV(
      devices.map((d) => ({
        name: d.name,
        ip: d.ip,
        status: d.status,
        latency: d.lastPing,
        lastSeen: d.lastSeen,
        uptime: d.uptimePercent,
      })),
      `devices-${new Date().toISOString().slice(0, 10)}.csv`
    );
    toast.success("Exported to CSV");
  };

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      refresh({ setLoadingState: false });
    }, 15000);

    return () => clearInterval(intervalId);
  }, [refresh]);

  const displayDevices =
    live.devices.length > 0 && live.connected ? live.devices : result?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
          <p className="text-sm text-muted-foreground">
            Manage monitored hosts and alert settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingDevice(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Device
          </Button>
        </div>
      </div>

      {showForm && (
        <DeviceForm
          device={editingDevice ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingDevice(null);
          }}
        />
      )}

      <SearchFilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
        enabledFilter={enabledFilter}
        onEnabledChange={(v) => {
          setEnabledFilter(v);
          setPage(1);
        }}
      />

      <DeviceTable
        devices={displayDevices}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        loading={loading}
      />

      {result && (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Inline edit/delete actions via context menu could be added; for now use details page */}
      {displayDevices.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Click <strong>Details</strong> on any device to view history, edit, or delete.
          </p>
        </div>
      )}
    </div>
  );
}
