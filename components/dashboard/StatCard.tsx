import { cn } from "@/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "red" | "purple";
  subtitle?: string;
}

const colorMap = {
  blue: "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20",
  green: "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20",
  red: "from-red-500/20 to-red-600/5 text-red-400 border-red-500/20",
  purple: "from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/20",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  color = "blue",
  subtitle,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6",
        colorMap[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="rounded-xl bg-background/50 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton mt-4 h-8 w-16 rounded" />
    </div>
  );
}
