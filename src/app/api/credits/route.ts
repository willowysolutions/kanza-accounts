import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch;
    const whereClause = session?.user?.role === 'admin' ? {} : { branchId };
      
    const credits = await prisma.credit.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {customer:true}
    });

    return NextResponse.json({ data: credits }, { status: 200 });
  } catch (error) {
    console.error("Error fetching credits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}