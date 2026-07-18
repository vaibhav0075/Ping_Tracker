import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { connectDB } from "@/lib/db";
import { signupSchema } from "@/lib/validations/auth";
import { User } from "@/models/User";
import { logger } from "@/utils/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = signupSchema.parse(body);
    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return NextResponse.json(
      {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("POST /api/auth/signup failed", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
