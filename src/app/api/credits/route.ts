import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const { searchParams } = new URL(req.url);
    const requestedBranchId = searchParams.get('branchId');
    const filter = searchParams.get('filter') || 'all';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    // Use requested branchId if provided, otherwise use session branchId
    const branchId = requestedBranchId || session?.user?.branch;
    // eslint-disable-next-line prefer-const
    let whereClause: any = session?.user?.role === 'admin' ? // eslint-disable-line @typescript-eslint/no-explicit-any
      (requestedBranchId ? { branchId: requestedBranchId } : {}) : 
      { branchId };

    // Add date filtering
    if (from && to && from === to) {
      // Single date filter - handle UTC dates properly
      const singleDate = new Date(from);
      // Create date range that accounts for timezone differences
      const startOfDay = new Date(singleDate.getFullYear(), singleDate.getMonth(), singleDate.getDate());
      const endOfDay = new Date(singleDate.getFullYear(), singleDate.getMonth(), singleDate.getDate() + 1);
      
      whereClause.date = {
        gte: startOfDay,
        lt: endOfDay
      };
    } else if (from || to) {
      whereClause.date = {};
      if (from) {
        const fromDate = new Date(from);
        whereClause.date.gte = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
      }
      if (to) {
        const toDate = new Date(to);
        whereClause.date.lte = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1);
      }
    } else if (filter !== 'all') {
      const now = new Date();
      switch (filter) {
        case 'today':
          whereClause.date = {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          };
          break;
        case 'yesterday': {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          whereClause.date = {
            gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
            lt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1)
          };
          break;
        }
        case 'week': {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          whereClause.date = { gte: startOfWeek };
          break;
        }
        case 'month':
          whereClause.date = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
          };
          break;
        case 'year':
          whereClause.date = {
            gte: new Date(now.getFullYear(), 0, 1),
            lt: new Date(now.getFullYear() + 1, 0, 1)
          };
          break;
      }
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // For single date or custom date range, disable pagination and return all data
    const isSingleDate = from && to && from === to;
    const isCustomDateRange = filter === 'custom' && (from || to);
    const shouldDisablePagination = isSingleDate || isCustomDateRange;
    const finalLimit = shouldDisablePagination ? 1000 : limit; // Max 1000 records for date filtering
    const finalSkip = shouldDisablePagination ? undefined : skip;

    // Get total count for pagination info
    const totalCount = await prisma.credit.count({
      where: whereClause,
    });

    // Get credits (paginated or all based on filter)
    const credits = await prisma.credit.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {customer:true, branch:true},
      skip: finalSkip,
      take: finalLimit,
    });

    const totalPages = shouldDisablePagination ? 1 : Math.ceil(totalCount / limit);


    return NextResponse.json({ 
      data: credits,
      pagination: shouldDisablePagination ? undefined : {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching credits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}