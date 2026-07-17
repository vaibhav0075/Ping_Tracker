import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getHistoryForExport } from "@/services/device.service";
import { exportHistoryToCsv } from "@/utils/helpers";
import { logger } from "@/utils/logger";

type RouteContext = { params: Promise<{ deviceId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await connectDB();
    const { deviceId } = await context.params;
    const data = await getHistoryForExport(deviceId);

    if (!data) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const csv = exportHistoryToCsv(data.history, data.deviceName);
    const filename = `${data.deviceName.replace(/[^a-z0-9]/gi, "_")}_history.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error("GET /api/history/:deviceId/export failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
