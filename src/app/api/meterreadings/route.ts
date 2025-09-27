import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

//get machine list
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const { searchParams } = new URL(req.url);
    const requestedBranchId = searchParams.get('branchId');
    
    // Use requested branchId if provided, otherwise use session branchId
    const branchId = requestedBranchId || session?.user?.branch;
    const whereClause = session?.user?.role === 'admin' ? 
      (requestedBranchId ? { branchId: requestedBranchId } : {}) : 
      { branchId };
    
    // Get pagination parameters from URL
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '16');
    const skip = (page - 1) * limit;
    const date = searchParams.get('date');

    // Add date filtering if provided
    let dateFilter = {};
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      dateFilter = {
        date: {
          gte: startDate,
          lt: endDate,
        },
      };
    }

    const finalWhereClause = { ...whereClause, ...dateFilter };

    // Get total count for pagination info
    const totalCount = await prisma.meterReading.count({
      where: finalWhereClause,
    });

    // Get paginated readings
    const readings = await prisma.meterReading.findMany({
      where: finalWhereClause,
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
