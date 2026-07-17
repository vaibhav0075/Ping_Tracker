"use client";

import { useEffect } from "react";
import {
  Server,
  Wifi,
  WifiOff,
  Gauge,
} from "lucide-react";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/StatCard";
import { DeviceTable } from "@/components/devices/DeviceTable";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { useDashboard } from "@/hooks/useDevices";
import { useDashboardLive, useAnimatedCounter } from "@/hooks/useSocket";
import { formatLatency } from "@/utils";

function AnimatedStatCard({
  title,
  value,
  icon,
  color,
  isLatency,
}: {
  title: string;
  value: number | null;
  icon: typeof Server;
  color: "blue" | "green" | "red" | "purple";
  isLatency?: boolean;
}) {
  const animated = useAnimatedCounter(value ?? 0);
  const displayValue = value === null 
    ? "—" 
    : (isLatency ? formatLatency(animated) : animated);
  return (
    <StatCard
      title={title}
      value={displayValue}
      icon={icon}
      color={color}
    />
  );
}

export function DashboardContent() {
  const { data, loading, error } = useDashboard();

  const stats = data?.stats ?? {
    totalDevices: 0,
    online: 0,
    offline: 0,
    averageLatency: 0,
  };
  const devices = data?.devices ?? [];

  const live = useDashboardLive(stats, devices);

  useEffect(() => {
    if (data) {
      live.stats;
    }
  }, [data]);

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-red-400">{error}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Make sure MongoDB is running and MONGODB_URI is configured.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time ICMP ping monitoring
          </p>
        </div>
        <LiveIndicator connected={live.connected} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <AnimatedStatCard
              title="Total Devices"
              value={live.stats.totalDevices}
              icon={Server}
              color="blue"
            />
            <AnimatedStatCard
              title="Online"
              value={live.stats.online}
              icon={Wifi}
              color="green"
            />
            <AnimatedStatCard
              title="Offline"
              value={live.stats.offline}
              icon={WifiOff}
              color="red"
            />
            <AnimatedStatCard
              title="Avg Latency"
              value={live.stats.averageLatency}
              icon={Gauge}
              color="purple"
              isLatency
            />
          </>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Devices</h2>
        <DeviceTable devices={live.devices} loading={loading} />
      </div>
    </div>
  );
}
