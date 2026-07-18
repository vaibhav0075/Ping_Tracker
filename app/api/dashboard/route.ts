import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";

import { requireAuth } from "@/lib/auth-helpers";

import { getAllDevicesForDashboard, getDashboardStats } from "@/services/device.service";

import { logger } from "@/utils/logger";



export async function GET() {

  try {

    const authResult = await requireAuth();

    if (authResult.response) return authResult.response;



    await connectDB();

    const [stats, devices] = await Promise.all([

      getDashboardStats(authResult.userId!),

      getAllDevicesForDashboard(authResult.userId!),

    ]);

    return NextResponse.json({ stats, devices });

  } catch (error) {

    logger.error("GET /api/dashboard failed", error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });

  }

}


