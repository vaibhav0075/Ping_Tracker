import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import type { DashboardStats } from "@/types";
import type { Device } from "@/types";
import { logger } from "@/utils/logger";

let io: SocketServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    logger.info("Socket", `Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      logger.info("Socket", `Client disconnected: ${socket.id}`);
    });
  });

  logger.info("Socket", "Socket.IO server initialized");
  return io;
}

export function getIO(): SocketServer | null {
  return io;
}

export function emitDeviceUpdate(device: Device): void {
  io?.emit("device:update", device);
}

export function emitDashboardUpdate(stats: DashboardStats): void {
  io?.emit("dashboard:update", stats);
}

export function emitPingResult(data: {
  deviceId: string;
  latency: number | null;
  status: string;
  timestamp: string;
}): void {
  io?.emit("ping:result", data);
}
