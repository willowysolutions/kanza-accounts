// /api/payments/due/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
try{
    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch;
    const whereClause = session?.user?.role === 'admin' ? {} : { branchId };
        
    const customers = await prisma.customer.findMany({
        where: { ...whereClause,outstandingPayments: { gt: 0 }},
        orderBy: { outstandingPayments: "asc" }, 
        select: { id: true, name: true, outstandingPayments: true, updatedAt: true },
    });
    return NextResponse.json({ customers });
}catch (error) {
    console.error("Error fetching payment dues:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
