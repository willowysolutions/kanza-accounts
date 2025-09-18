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
    
    const readings = await prisma.meterReading.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      include: { nozzle: true, branch: true }
    });

    // Calculate difference
    const withDifference = readings.map(r => ({
      ...r,
      difference: (() => {
        const opening = readings.find(o =>
          o.nozzleId === r.nozzleId
        );

        const closing = readings.find(c =>
          c.nozzleId === r.nozzleId
        );

        return opening && closing
          ? closing.closingReading - opening.openingReading
          : null;
      })()
    }));

    return NextResponse.json({ withDifference }, { status: 200 });
  } catch (error) {
    console.error("Error fetching meter readings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
