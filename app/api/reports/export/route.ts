
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getReportData } from "@/services/device.service";
import { exportReportToExcel } from "@/utils/helpers";
import { logger } from "@/utils/logger";

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.response) return authResult.response;
    await connectDB();
    const { deviceIds, startDate, endDate, reportType } = await request.json();
    const reportData = await getReportData(authResult.userId!, deviceIds, startDate, endDate);
    const buffer = await exportReportToExcel(reportData, reportType);
    const filename = `ping_report_${startDate}_to_${endDate}.xlsx`;
    return new NextResponse(new Blob([buffer as any]), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error("POST /api/reports/export failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
