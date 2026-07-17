import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAllDevicesForDashboard, getDashboardStats } from "@/services/device.service";
import { logger } from "@/utils/logger";

export async function GET() {
  try {
    await connectDB();
    const [stats, devices] = await Promise.all([
      getDashboardStats(),
      getAllDevicesForDashboard(),
    ]);
    return NextResponse.json({ stats, devices });
  } catch (error) {
    logger.error("GET /api/dashboard failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
