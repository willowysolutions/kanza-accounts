export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    const branchId = session?.user?.branch;
    const whereClause = session?.user?.role === 'admin' || !branchId ? {} : { branchId };
    

    const expense = await prisma.expense.findMany({
      where: whereClause,
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