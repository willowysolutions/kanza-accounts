import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

//get machine list
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch;
    const whereClause = session?.user?.role === 'admin' ? {} : { branchId };
    
    // Get pagination parameters from URL
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '16');
    const skip = (page - 1) * limit;

    // Get total count for pagination info
    const totalCount = await prisma.meterReading.count({
      where: whereClause,
    });

    // Get paginated readings
    const readings = await prisma.meterReading.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      include: { nozzle: true, branch: true },
      skip,
      take: limit,
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

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({ 
      withDifference,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching meter readings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
