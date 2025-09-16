import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const expenseCategory = await prisma.expenseCategory.findMany({
      orderBy: { name: "desc" },
      include: {expenses:true}
    });

    return NextResponse.json({ data: expenseCategory }, { status: 200 });
  } catch (error) {
    console.error("Error fetching expense category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}