import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {

    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch;
    const whereClause = session?.user?.role === 'admin' ? {} : { branchId };
  
    const balanceReceipts = await prisma.balanceReceipt.findMany({
      where : whereClause,
      include:{branch:true},
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ balanceReceipts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching balance receipts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}