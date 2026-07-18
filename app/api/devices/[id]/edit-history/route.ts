import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { getDeviceEditHistory } from "@/services/device.service";
import { logger } from "@/utils/logger";

type RouteContext = { params: Promise<{ id: string }> };

const editHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: Request, context: RouteContext) {
  try {
    const authResult = await requireAuth();
    if (authResult.response) return authResult.response;

    await connectDB();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const params = editHistoryQuerySchema.parse(Object.fromEntries(searchParams));
    const result = await getDeviceEditHistory(authResult.userId!, id, params);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("GET /api/devices/:id/edit-history failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
