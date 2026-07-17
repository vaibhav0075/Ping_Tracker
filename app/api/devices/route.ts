import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { deviceQuerySchema } from "@/lib/validations/device";
import { getDevices } from "@/services/device.service";
import { logger } from "@/utils/logger";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const params = deviceQuerySchema.parse(Object.fromEntries(searchParams));
    const result = await getDevices(params);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("GET /api/devices failed", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { deviceCreateSchema } = await import("@/lib/validations/device");
    const input = deviceCreateSchema.parse(body);
    const { createDevice } = await import("@/services/device.service");
    const device = await createDevice(input);
    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    logger.error("POST /api/devices failed", error);
    if (error instanceof Error && error.name === "ZodError") {
      const { ZodError } = await import("zod");
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
