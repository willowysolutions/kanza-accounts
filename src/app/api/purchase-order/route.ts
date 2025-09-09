import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

//get purchase order list
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch;
    const whereClause = session?.user?.role === 'admin' ? {} : { branchId };
    
    const purchaseOrder = await prisma.purchaseOrder.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include:{supplier:true}
    });

    return NextResponse.json({ purchaseOrder }, { status: 200 });
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}