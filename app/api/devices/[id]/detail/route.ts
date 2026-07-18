import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getDeviceDetail } from "@/services/device.service";
import { logger } from "@/utils/logger";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const authResult = await requireAuth();
    if (authResult.response) return authResult.response;

    await connectDB();
    const { id } = await context.params;
    const detail = await getDeviceDetail(authResult.userId!, id);
    if (!detail) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    logger.error("GET /api/devices/:id/detail failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
