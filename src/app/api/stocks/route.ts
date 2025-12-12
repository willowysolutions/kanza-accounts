import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

//get stock list
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch;
    const userRole = session?.user?.role?.toLowerCase();
    const whereClause = (userRole === 'admin' || userRole === 'gm') ? {} : { branchId };
    
    const stocks = await prisma.stock.findMany({
      where: whereClause,
      orderBy: { item: "desc" },
      include:{supplier:true, branch:true}
    });

    return NextResponse.json({ data: stocks }, { status: 200 });
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}