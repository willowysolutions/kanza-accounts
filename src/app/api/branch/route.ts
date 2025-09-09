import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

//get branch list
export async function GET() {
  try {
    const branch = await prisma.branch.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: branch }, { status: 200 });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}