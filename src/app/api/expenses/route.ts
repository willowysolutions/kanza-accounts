import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const expense = await prisma.expense.findMany({
      orderBy: { date: "desc" },
      include:{category:true}
    });

    return NextResponse.json({ data: expense }, { status: 200 });
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}