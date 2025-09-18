import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch;
    const whereClause = session?.user?.role === 'admin' || !branchId ? {} : { branchId };

    const bankDeposite = await prisma.bankDeposite.findMany({
      where: whereClause,
      orderBy: { bankId: "desc" },
      include:{bank:true, branch:true}
    });

    return NextResponse.json({ bankDeposite }, { status: 200 });
  } catch (error) {
    console.error("Error fetching bank deposite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}