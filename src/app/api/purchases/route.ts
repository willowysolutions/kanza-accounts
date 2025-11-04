import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

function getDateRange(filter?: string, from?: string, to?: string) {
  const now = new Date();
  let start: Date | undefined;
  let end: Date | undefined;

  switch (filter) {
    case "today":
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date();
      break;
    case "yesterday":
      start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      break;
    case "week":
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      end = new Date();
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date();
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date();
      break;
    case "custom":
      if (from) start = new Date(from);
      if (to) {
        end = new Date(to);
        end.setHours(23, 59, 59, 999);
      }
      break;
    case "all":
    default:
      start = undefined;
      end = undefined;
  }

  return { start, end };
}

//get purchase list
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const { start, end } = getDateRange(filter, from, to);

    const session = await auth.api.getSession({ headers: await headers() });
    const requestedBranchId = searchParams.get('branchId');
    
    // Use requested branchId if provided, otherwise use session branchId
    const branchId = requestedBranchId || session?.user?.branch;
    const whereClause = session?.user?.role === 'admin' ? 
      (requestedBranchId ? { branchId: requestedBranchId } : {}) : 
      { branchId };

    // Add date filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateFilter: any = {};
    if (start) dateFilter.gte = start;
    if (end) dateFilter.lte = end;

    // Get pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;
    
    // For custom date range, disable pagination and return all data
    const isCustomDateRange = filter === 'custom' && (from || to);
    const finalLimit = isCustomDateRange ? undefined : limit;
    const finalSkip = isCustomDateRange ? undefined : skip;

    // Get total count for pagination info
    const totalCount = await prisma.purchase.count({
      where: {
        ...whereClause,
        date: dateFilter,
      },
    });

    // Get purchases (paginated or all based on filter)
    const purchase = await prisma.purchase.findMany({
      where: {
        ...whereClause,
        date: dateFilter,
      },
      orderBy: { createdAt: "desc" },
      include:{supplier:true, branch:true},
      skip: finalSkip,
      take: finalLimit,
    });

    const totalPages = isCustomDateRange ? 1 : Math.ceil(totalCount / limit);
    
    // Check if totals are requested
    const includeTotals = searchParams.get('includeTotals') === 'true';
    let totals = undefined;
    
    if (includeTotals && requestedBranchId) {
      // Use aggregation queries for better performance
      const branchFilter = { branchId: requestedBranchId };
      
      const [
        xgDieselResult,
        hsdDieselResult,
        msPetrolResult,
        twoTOilResult
      ] = await Promise.all([
        // XG-DIESEL total
        prisma.purchase.aggregate({
          where: {
            ...branchFilter,
            productType: "XG-DIESEL",
          },
          _sum: { quantity: true },
        }),
        // HSD-DIESEL total
        prisma.purchase.aggregate({
          where: {
            ...branchFilter,
            productType: "HSD-DIESEL",
          },
          _sum: { quantity: true },
        }),
        // MS-PETROL total
        prisma.purchase.aggregate({
          where: {
            ...branchFilter,
            productType: "MS-PETROL",
          },
          _sum: { quantity: true },
        }),
        // 2T-OIL total
        prisma.purchase.aggregate({
          where: {
            ...branchFilter,
            productType: "2T-OIL",
          },
          _sum: { quantity: true },
        }),
      ]);
      
      totals = {
        xgDiesel: xgDieselResult._sum.quantity || 0,
        hsdDiesel: hsdDieselResult._sum.quantity || 0,
        msPetrol: msPetrolResult._sum.quantity || 0,
        twoTOil: twoTOilResult._sum.quantity || 0,
      };
    }
    
    return NextResponse.json({ 
      purchase,
      pagination: isCustomDateRange ? undefined : {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      },
      ...(totals && { totals })
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}