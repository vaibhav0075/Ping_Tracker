import { NextResponse } from "next/server";

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function notFoundResponse(message = "Resource not found") {
  return errorResponse(message, 404);
}

export function serverErrorResponse(message = "Internal server error") {
  return errorResponse(message, 500);
}

export async function handleApiError(error: unknown) {
  console.error("[API Error]", error);
  if (error instanceof Error) {
    return errorResponse(error.message, 400);
  }
  return serverErrorResponse();
}
