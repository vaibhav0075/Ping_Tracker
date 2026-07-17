"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import type { PingHistoryEntry } from "@/types";

interface LatencyChartProps {
  data: PingHistoryEntry[];
  liveData?: { latency: number | null; timestamp: string; status: string }[];
}

export function LatencyChart({ data, liveData = [] }: LatencyChartProps) {
  const chartData = [
    ...data.map((d) => ({
      time: new Date(d.timestamp).getTime(),
      latency: d.status === "online" ? d.latency : null,
      status: d.status,
    })),
    ...liveData.map((d) => ({
      time: new Date(d.timestamp).getTime(),
      latency: d.status === "online" ? d.latency : null,
      status: d.status,
    })),
  ].slice(-100);

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
        No ping data yet
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="time"
            tickFormatter={(t) => format(new Date(t), "HH:mm:ss")}
            stroke="var(--muted-foreground)"
            fontSize={11}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={11}
            unit=" ms"
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--foreground)",
            }}
            labelFormatter={(t) => format(new Date(t), "PPpp")}
            formatter={(value: number) => [`${Math.round(value)} ms`, "Latency"]}
          />
          <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="latency"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
