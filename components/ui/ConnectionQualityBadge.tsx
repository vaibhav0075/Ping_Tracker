import { cn, getQualityColor } from "@/utils";
import type { ConnectionQuality } from "@/types";

interface ConnectionQualityBadgeProps {
  quality: ConnectionQuality;
}

const labels: Record<ConnectionQuality, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  offline: "Offline",
};

export function ConnectionQualityBadge({ quality }: ConnectionQualityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        getQualityColor(quality)
      )}
    >
      {labels[quality]}
    </span>
  );
}
