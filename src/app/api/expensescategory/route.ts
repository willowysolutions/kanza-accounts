import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    await auth.api.getSession({ headers: await headers() });

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