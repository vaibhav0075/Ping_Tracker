import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";

import { requireAuth } from "@/lib/auth-helpers";

import { historyQuerySchema } from "@/lib/validations/device";

import { getDeviceHistory } from "@/services/device.service";

import { logger } from "@/utils/logger";



type RouteContext = { params: Promise<{ deviceId: string }> };



export async function GET(request: Request, context: RouteContext) {

  try {

    const authResult = await requireAuth();

    if (authResult.response) return authResult.response;



    await connectDB();

    const { deviceId } = await context.params;

    const { searchParams } = new URL(request.url);

    const params = historyQuerySchema.parse(Object.fromEntries(searchParams));

    const result = await getDeviceHistory(authResult.userId!, deviceId, params);

    return NextResponse.json(result);

  } catch (error) {

    logger.error("GET /api/history/:deviceId failed", error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });

  }

}


