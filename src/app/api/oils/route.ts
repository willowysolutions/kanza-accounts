import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const oils = await prisma.oil.findMany({
      orderBy: { productType: "desc" },
    });

    return NextResponse.json({ oils }, { status: 200 });
  } catch (error) {
    console.error("Error fetching oils:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}