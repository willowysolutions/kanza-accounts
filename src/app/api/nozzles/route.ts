import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch;
    const userRole = session?.user?.role?.toLowerCase();
    const whereClause = (userRole === 'admin' || userRole === 'gm') ? {} : { branchId };

    const nozzles = await prisma.nozzle.findMany({
      where: whereClause,
      orderBy: { nozzleNumber: "asc" },
      include:{machine:true,branch:true}
    });

    return NextResponse.json({ data: nozzles }, { status: 200 });
  } catch (error) {
    console.error("Error fetching nozzles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}