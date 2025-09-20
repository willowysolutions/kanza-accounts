import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

//get machine list
export async function GET() {
  try {
  const session = await auth.api.getSession({ headers: await headers() });
  const branchId = session?.user?.branch;
  const whereClause = session?.user?.role === 'admin' ? {} : { branchId };
    
    const machine = await prisma.machine.findMany({
      where: whereClause,
      orderBy: { machineName: "asc" },
      include:{machineTanks:{
        include:{
          tank:true
        }
      }, branch:true}
    });

    return NextResponse.json({ data: machine }, { status: 200 });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

