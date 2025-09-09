import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {

    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch;
    const whereClause = session?.user?.role === 'admin' ? {} : { branchId };
  
    const banks = await prisma.bank.findMany({
      where : whereClause,
      orderBy: { bankName: "asc" },
    });

    return NextResponse.json({ banks }, { status: 200 });
  } catch (error) {
    console.error("Error fetching banks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}