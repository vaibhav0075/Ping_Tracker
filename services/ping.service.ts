import ping from "ping";
import { logger } from "@/utils/logger";

export interface PingResult {
  alive: boolean;
  latency: number | null;
  error?: string;
}

export async function icmpPing(
  host: string,
  timeout = 2
): Promise<PingResult> {
  try {
    const result = await ping.promise.probe(host, {
      timeout,
      min_reply: 1,
    });

    return {
      alive: result.alive,
      latency: result.alive && result.time !== "unknown" ? Number(result.time) : null,
    };
  } catch (error) {
    logger.debug(`Ping failed for ${host}`, error);
    return {
      alive: false,
      latency: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
