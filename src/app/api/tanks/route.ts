import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";


//get tank list
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch;
    const whereClause = session?.user?.role === 'admin' ? {} : { branchId };
    
    const tank = await prisma.tank.findMany({
      where: whereClause,
      orderBy: { tankName: "asc" },
      include:{supplier:true, branch:true}
    });

    return NextResponse.json({ data: tank }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tanks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}