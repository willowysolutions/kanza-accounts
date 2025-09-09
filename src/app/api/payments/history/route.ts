import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

//get sales list
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch;
    const whereClause = session?.user?.role === 'admin' ? {} : { branchId };

    const paymentHistory = await prisma.paymentHistory.findMany({
      where: whereClause,
      orderBy: { paidOn: "desc" },
      include:{customer:true,supplier:true}
    });

    return NextResponse.json({ paymentHistory }, { status: 200 });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}