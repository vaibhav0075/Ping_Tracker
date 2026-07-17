import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

// Load .env file for the worker
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

import { connectDB } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { eventBus } from "@/lib/event-bus";
import { Device, serializeDevice } from "@/models/Device";
import { sendOfflineAlert, sendRecoveryAlert } from "@/services/email.service";
import {
  cleanupOldHistory,
  getDashboardStats,
  recordPingResult,
} from "@/services/device.service";
import { icmpPing } from "@/services/ping.service";
import { runWithConcurrency } from "@/utils/helpers";
import { logger } from "@/utils/logger";
import type { IDevice } from "@/models/Device";

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;
let cleanupIntervalId: NodeJS.Timeout | null = null;

async function processDevice(device: IDevice): Promise<void> {
  const previousStatus = device.status;
  const previousLastSeen = device.lastSeen;

  const result = await icmpPing(device.ip);
  const { device: updated } = await recordPingResult(
    device,
    result.alive,
    result.latency
  );

  eventBus.publish({
    type: "ping",
    deviceId: updated._id.toString(),
    latency: result.alive ? result.latency : null,
    status: updated.status,
    timestamp: new Date().toISOString(),
  });

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  if (!result.alive) {
    // If device is offline:
    // Either it just went offline (previousStatus wasn't offline) OR last alert was over 1 minute ago
    const shouldSendAlert = (
      (previousStatus !== "offline" && !updated.alertSent) || 
      (updated.alertSent && (!updated.lastAlertSentAt || updated.lastAlertSentAt < oneMinuteAgo))
    );

    if (shouldSendAlert) {
      const sent = await sendOfflineAlert({
        to: updated.email,
        deviceName: updated.name,
        ip: updated.ip,
        timestamp: now,
        lastSuccessfulPing: previousLastSeen,
      });

      if (sent) {
        updated.alertSent = true;
        updated.lastAlertSentAt = now;
        await updated.save();
      }
    }
  }

  if (result.alive && previousStatus === "offline") {
    if (updated.alertSent) {
      await sendRecoveryAlert({
        to: updated.email,
        deviceName: updated.name,
        ip: updated.ip,
        latency: result.latency ?? 0,
        recoveryTime: now,
      });
    }
    updated.alertSent = false;
    updated.lastAlertSentAt = null;
    await updated.save();
  }
}

async function runPingCycle(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    await connectDB();
    const devices = await Device.find({ enabled: true });
    const { MAX_CONCURRENT_PINGS } = getEnv();

    await runWithConcurrency(devices, MAX_CONCURRENT_PINGS, processDevice);

    const stats = await getDashboardStats();
    const allDevices = await Device.find().sort({ name: 1 });

    eventBus.publish({
      type: "stats",
      stats,
    });

    eventBus.publish({
      type: "status",
      devices: allDevices.map(serializeDevice),
      stats,
    });
  } catch (error) {
    logger.error("Ping cycle failed", error);
  } finally {
    isRunning = false;
  }
}

export function startPingWorker(): void {
  const { PING_INTERVAL_MS, PING_HISTORY_RETENTION_DAYS } = getEnv();

  logger.info(
    `Starting ping worker (interval: ${PING_INTERVAL_MS}ms, concurrency: ${getEnv().MAX_CONCURRENT_PINGS})`
  );

  runPingCycle();

  intervalId = setInterval(runPingCycle, PING_INTERVAL_MS);

  cleanupIntervalId = setInterval(
    async () => {
      try {
        await connectDB();
        const deleted = await cleanupOldHistory(PING_HISTORY_RETENTION_DAYS);
        if (deleted > 0) {
          logger.info(`Cleaned up ${deleted} old ping history records`);
        }
      } catch (error) {
        logger.error("History cleanup failed", error);
      }
    },
    24 * 60 * 60 * 1000
  );
}

export function stopPingWorker(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
  logger.info("Ping worker stopped");
}

// Run when executed directly
if (process.argv[1] === __filename) {
  startPingWorker();

  process.on("SIGINT", () => {
    stopPingWorker();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    stopPingWorker();
    process.exit(0);
  });
}
