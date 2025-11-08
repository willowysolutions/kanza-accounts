import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "better-auth/crypto";

const updatePasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = updatePasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { userId, password } = result.data;

    // Find the user's account with password provider
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        providerId: "credential",
      },
    });

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found",
        },
        { status: 404 }
      );
    }

    // Hash the password using better-auth's internal hashing function
    // Better-auth uses Scrypt by default for password hashing
    // We must use the same hashing method that better-auth uses for login verification
    const hashedPassword = await hashPassword(password);

    // Verify the hash was created successfully
    if (!hashedPassword || hashedPassword.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to hash password",
        },
        { status: 500 }
      );
    }

    // Update the password in the Account table
    // Make sure we're updating the correct account record
    const updatedAccount = await prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Verify the update was successful
    if (!updatedAccount || updatedAccount.password !== hashedPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Password update verification failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update password error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update password",
      },
      { status: 500 }
    );
  }
}
