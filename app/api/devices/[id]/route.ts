import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";

import { requireAuth } from "@/lib/auth-helpers";

import { deviceUpdateSchema } from "@/lib/validations/device";

import { deleteDevice, getDeviceById, updateDevice } from "@/services/device.service";

import { logger } from "@/utils/logger";

import { ZodError } from "zod";



type RouteContext = { params: Promise<{ id: string }> };



export async function GET(_request: Request, context: RouteContext) {

  try {

    const authResult = await requireAuth();

    if (authResult.response) return authResult.response;



    await connectDB();

    const { id } = await context.params;

    const device = await getDeviceById(authResult.userId!, id);

    if (!device) {

      return NextResponse.json({ error: "Device not found" }, { status: 404 });

    }

    return NextResponse.json(device);

  } catch (error) {

    logger.error("GET /api/devices/:id failed", error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });

  }

}



export async function PUT(request: Request, context: RouteContext) {

  try {

    const authResult = await requireAuth();

    if (authResult.response) return authResult.response;



    await connectDB();

    const { id } = await context.params;

    const body = await request.json();

    const input = deviceUpdateSchema.parse(body);

    const device = await updateDevice(authResult.userId!, id, input);

    if (!device) {

      return NextResponse.json({ error: "Device not found" }, { status: 404 });

    }

    return NextResponse.json(device);

  } catch (error) {

    logger.error("PUT /api/devices/:id failed", error);

    if (error instanceof ZodError) {

      return NextResponse.json(

        { error: "Validation failed", details: error.errors },

        { status: 400 }

      );

    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });

  }

}



export async function DELETE(_request: Request, context: RouteContext) {

  try {

    const authResult = await requireAuth();

    if (authResult.response) return authResult.response;



    await connectDB();

    const { id } = await context.params;

    const deleted = await deleteDevice(authResult.userId!, id);

    if (!deleted) {

      return NextResponse.json({ error: "Device not found" }, { status: 404 });

    }

    return NextResponse.json({ success: true });

  } catch (error) {

    logger.error("DELETE /api/devices/:id failed", error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });

  }

}


