import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

//get sales list
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const { searchParams } = new URL(req.url);
    const requestedBranchId = searchParams.get('branchId');
    
    // Use requested branchId if provided, otherwise use session branchId
    const branchId = requestedBranchId || session?.user?.branch;
    const isAdmin = session?.user?.role?.toLowerCase() === 'admin';
    const whereClause = isAdmin || !branchId
      ? (requestedBranchId ? { branchId: requestedBranchId } : {})
      : {
          OR: [
            { branchId },
            { customer: { is: { branchId } } },
          ],
        };
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;

    // Get total count for pagination info
    const totalCount = await prisma.paymentHistory.count({
      where: whereClause,
    });

    // Get paginated payment history
    const paymentHistory = await prisma.paymentHistory.findMany({
      where: whereClause,
      orderBy: { paidOn: "desc" },
      include:{customer:true,supplier:true},
      skip,
      take: limit,
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

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({ 
      paymentHistory: paymentHistoryWithCredits,
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
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}