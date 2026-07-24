
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getAllDevicesForReport } from "@/services/device.service";
import { logger } from "@/utils/logger";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.response) return authResult.response;
    await connectDB();
    const devices = await getAllDevicesForReport(authResult.userId!);
    return NextResponse.json(devices);
  } catch (error) {
    logger.error("GET /api/reports/devices failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
