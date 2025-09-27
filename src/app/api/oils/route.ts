import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
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
    const totalCount = await prisma.oil.count({
      where: finalWhereClause,
    });

    // Get paginated oils
    const oils = await prisma.oil.findMany({
      where: finalWhereClause,
      orderBy: { date: "desc" },
      include: { branch: true },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({ 
      oils,
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
    console.error("Error fetching oils:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}