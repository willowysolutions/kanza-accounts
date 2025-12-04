import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const requestedBranchId = searchParams.get('branchId');
    
    const { start, end } = getDateRange(filter, from, to);
    
    // Use requested branchId if provided, otherwise use session branchId
    const branchId = requestedBranchId || session?.user?.branch;
    const isAdmin = session?.user?.role?.toLowerCase() === 'admin';
    
    // Add date filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateFilter: any = {};
    if (start) dateFilter.gte = start;
    if (end) dateFilter.lte = end;
    
    const whereClause = isAdmin || !branchId
      ? (requestedBranchId ? { branchId: requestedBranchId } : {})
      : {
          OR: [
            { branchId },
            { customer: { is: { branchId } } },
          ],
        };
    
    // Add date filter to where clause
    const finalWhereClause = {
      ...whereClause,
      paidOn: dateFilter,
    };
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // For custom date range, disable pagination and return all data
    const isCustomDateRange = filter === 'custom' && (from || to);
    const finalLimit = isCustomDateRange ? undefined : limit;
    const finalSkip = isCustomDateRange ? undefined : skip;

    // Get total count for pagination info
    const totalCount = await prisma.paymentHistory.count({
      where: finalWhereClause,
    });

    // Get payment history (paginated or all based on filter)
    const paymentHistory = await prisma.paymentHistory.findMany({
      where: finalWhereClause,
      orderBy: { paidOn: "desc" },
      include:{customer:true,supplier:true},
      skip: finalSkip,
      take: finalLimit,
    });

    // Get credits for the same dates and customers
    const paymentDates = paymentHistory.map(p => p.paidOn);
    const customerIds = paymentHistory.filter(p => p.customerId).map(p => p.customerId).filter((id): id is string => id !== null);
    
    const credits = await prisma.credit.findMany({
      where: {
        customerId: { in: customerIds },
        date: { in: paymentDates }
      },
      select: {
        amount: true,
        date: true,
        customerId: true
      }
    });

    // Merge credits with payments
    const paymentHistoryWithCredits = paymentHistory.map(payment => {
      const creditsForPayment = credits.filter(credit => 
        credit.customerId === payment.customerId && 
        credit.date.toDateString() === payment.paidOn.toDateString()
      );
      
      const totalCredits = creditsForPayment.reduce((sum, credit) => sum + credit.amount, 0);
      
      return {
        ...payment,
        creditGiven: totalCredits
      };
    });

    const totalPages = isCustomDateRange ? 1 : Math.ceil(totalCount / limit);

    return NextResponse.json({ 
      paymentHistory: paymentHistoryWithCredits,
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
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}