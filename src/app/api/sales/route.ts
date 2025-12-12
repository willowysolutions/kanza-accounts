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

//get sales list
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    
    // Get pagination parameters with reasonable limits
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 records
    const skip = (page - 1) * limit;
    
    // For custom date range, disable pagination but limit to prevent timeouts
    const isCustomDateRange = filter === 'custom' && (from || to);
    const finalLimit = isCustomDateRange ? 1000 : limit; // Max 1000 records for custom date range
    const finalSkip = isCustomDateRange ? undefined : skip;

    const { start, end } = getDateRange(filter, from, to);

    const session = await auth.api.getSession({ headers: await headers() });
    const requestedBranchId = searchParams.get('branchId');
    
    // Use requested branchId if provided, otherwise use session branchId
    const branchId = requestedBranchId || session?.user?.branch;
    const whereClause = (session?.user?.role === 'admin' || session?.user?.role === 'gm') ? 
      (requestedBranchId ? { branchId: requestedBranchId } : {}) : 
      { branchId };
    
    // Add date filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateFilter: any = {};
    if (start) dateFilter.gte = start;
    if (end) dateFilter.lte = end;

    // Get total count for pagination info
    const totalCount = await prisma.sale.count({
      where: {
        ...whereClause,
        date: dateFilter,
      },
    });

    // Get sales (paginated or all based on filter)
    const sales = await prisma.sale.findMany({
      where: {
        ...whereClause,
        date: dateFilter,
      },
      orderBy: { createdAt: "desc" },
      include: { branch: true },
      skip: finalSkip,
      take: finalLimit,
    });

    const totalPages = isCustomDateRange ? 1 : Math.ceil(totalCount / limit);

    return NextResponse.json({ 
      sales,
      pagination: isCustomDateRange ? undefined : {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}