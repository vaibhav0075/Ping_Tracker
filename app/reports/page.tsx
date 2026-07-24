"use client";

import { useState, useEffect } from "react";
import { Download, Calendar, CheckCircle2, XCircle, Activity } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Device } from "@/types";

type ReportType = "summary" | "detailed" | "both";

export default function ReportsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [reportType, setReportType] = useState<ReportType>("both");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Fetch devices on mount
  useEffect(() => {
    async function fetchDevices() {
      try {
        const res = await fetch("/api/reports/devices");
        if (res.ok) {
          const data = await res.json();
          setDevices(data);
        }
      } catch (error) {
        toast.error("Failed to load devices");
      }
    }
    fetchDevices();
  }, []);

  const handleGenerateReport = async () => {
    if (selectedDeviceIds.length === 0) {
      toast.error("Please select at least one device");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reports/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceIds: selectedDeviceIds, startDate, endDate }),
      });
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
        setShowResults(true);
        toast.success("Report generated");
      } else {
        toast.error("Failed to generate report");
      }
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceIds: selectedDeviceIds, startDate, endDate, reportType }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const filename = `ping_report_${startDate}_to_${endDate}.xlsx`;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Report exported");
      } else {
        toast.error("Failed to export report");
      }
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  const toggleDevice = (id: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedDeviceIds(devices.map((d) => d._id));
  };

  const deselectAll = () => {
    setSelectedDeviceIds([]);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate and export ping reports for your devices
          </p>
        </div>
      </div>

      {/* Report Form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Devices</label>
            <div className="flex gap-2 mb-3">
              <Button variant="secondary" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="secondary" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {devices.map((device) => (
                <div
                  key={device._id}
                  onClick={() => toggleDevice(device._id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDeviceIds.includes(device._id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded border flex items-center justify-center ${
                      selectedDeviceIds.includes(device._id)
                        ? "bg-primary border-primary"
                        : "border-border"
                    }`}
                  >
                    {selectedDeviceIds.includes(device._id) && (
                      <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{device.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{device.ip}</p>
                  </div>
                  <StatusBadge status={device.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(["summary", "detailed", "both"] as ReportType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setReportType(type)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      reportType === type
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleGenerateReport} disabled={loading}>
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Generate Report
          </Button>
          {showResults && (
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          )}
        </div>
      </div>

      {/* Report Results */}
      {showResults && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Report Results</h2>

          {/* Summary Section */}
          {(reportType === "summary" || reportType === "both") && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Summary</h3>
              {reportData.map((item, index) => (
                <div
                  key={item.device._id || index}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-md font-medium">{item.device.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.device.ip}</p>
                    </div>
                    <StatusBadge status={item.device.status} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                      <p className="text-lg font-semibold">{item.uptimePercent.toFixed(2)}%</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Total Downtime</p>
                      <p className="text-lg font-semibold">
                        {(() => {
                          const ms = item.totalDowntimeMs;
                          const minutes = Math.floor(ms / 60000);
                          const hours = Math.floor(minutes / 60);
                          const days = Math.floor(hours / 24);
                          if (days > 0) return `${days}d ${hours % 24}h`;
                          if (hours > 0) return `${hours}h ${minutes % 60}m`;
                          return `${minutes}m`;
                        })()}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Avg Latency</p>
                      <p className="text-lg font-semibold">
                        {item.averageLatency != null ? `${item.averageLatency}ms` : "N/A"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Min Latency</p>
                      <p className="text-lg font-semibold">
                        {item.minLatency != null ? `${item.minLatency}ms` : "N/A"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Max Latency</p>
                      <p className="text-lg font-semibold">
                        {item.maxLatency != null ? `${item.maxLatency}ms` : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detailed Section */}
          {(reportType === "detailed" || reportType === "both") && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Detailed</h3>
              {reportData.map((item, index) => (
                <div
                  key={item.device._id || index}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-md font-medium">{item.device.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.device.ip}</p>
                    </div>
                    <StatusBadge status={item.device.status} />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-muted-foreground">Timestamp</th>
                          <th className="text-left py-2 px-3 text-muted-foreground">Status</th>
                          <th className="text-left py-2 px-3 text-muted-foreground">Latency (ms)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.history.map((h: any, i: number) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2 px-3">{new Date(h.timestamp).toLocaleString()}</td>
                            <td className="py-2 px-3">
                              <StatusBadge status={h.status} />
                            </td>
                            <td className="py-2 px-3">{h.latency ?? "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
