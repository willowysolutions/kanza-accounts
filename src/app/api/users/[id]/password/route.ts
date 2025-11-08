import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the user's account with password provider
    const account = await prisma.account.findFirst({
      where: {
        userId: id,
        providerId: "credential",
      },
      select: {
        password: true,
      },
    });

    if (!account || !account.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Password not found for this user",
          password: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        password: account.password,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching password:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch password",
        password: null,
      },
      { status: 500 }
    );
  }
}

