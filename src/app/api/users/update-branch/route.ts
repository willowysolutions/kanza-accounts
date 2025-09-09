// app/api/users/update-branch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateBranchSchema = z.object({
  userId: z.string(),
  branchId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = updateBranchSchema.safeParse(body);

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

    const { userId, branchId } = result.data;

    await prisma.user.update({
      where: { id: userId },
      data: { branch: branchId },
    });

    return NextResponse.json(
      {
        success: true,
        message: "User branch updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user branch error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user branch",
      },
      { status: 500 }
    );
  }
}
