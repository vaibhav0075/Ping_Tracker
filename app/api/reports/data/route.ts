
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getReportData } from "@/services/device.service";
import { logger } from "@/utils/logger";

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.response) return authResult.response;
    await connectDB();
    const { deviceIds, startDate, endDate } = await request.json();
    const reportData = await getReportData(authResult.userId!, deviceIds, startDate, endDate);
    return NextResponse.json(reportData);
  } catch (error) {
    logger.error("POST /api/reports/data failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
