import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch;
    const whereClause = session?.user?.role === 'admin' ? {} : { branchId };

    const oils = await prisma.oil.findMany({
      where: whereClause,
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