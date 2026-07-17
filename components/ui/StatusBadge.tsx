import { cn, getStatusBg, getStatusColor } from "@/utils";

interface StatusBadgeProps {
  status: string;
  pulse?: boolean;
}

export function StatusBadge({ status, pulse = false }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        getStatusBg(status),
        getStatusColor(status)
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "online" && "bg-emerald-400",
          status === "offline" && "bg-red-400",
          status === "unknown" && "bg-amber-400",
          pulse && status === "online" && "animate-pulse-dot"
        )}
      />
      {status}
    </span>
  );
}
