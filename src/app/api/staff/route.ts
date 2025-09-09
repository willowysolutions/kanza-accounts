import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const staff = await prisma.user.findMany({
      where: { role: "staff" },
      select: { id: true, name: true },
    });
    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
