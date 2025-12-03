import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const { searchParams } = new URL(req.url);
    const requestedBranchId = searchParams.get('branchId');
    const search = searchParams.get('search');
    
    // Use requested branchId if provided, otherwise use session branchId
    const branchId = requestedBranchId || session?.user?.branch;
    
    // Build where clause with search functionality
    const whereClause: {
      branchId?: string;
      name?: {
        contains: string;
        mode: 'insensitive';
      };
    } = {};
    
    // Add branch filter
    if (session?.user?.role === 'admin') {
      if (requestedBranchId) {
        whereClause.branchId = requestedBranchId;
      }
    } else {
      whereClause.branchId = branchId || undefined;
    }
    
    // Add search filter if provided
    if (search && search.trim()) {
      whereClause.name = {
        contains: search.trim(),
        mode: 'insensitive'
      };
    }
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;

    // Get total count for pagination info
    const totalCount = await prisma.customer.count({
      where: whereClause,
    });

    // Get paginated customers
    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { name: "desc" },
      include: { branch: true },
      skip,
      take: limit,
    });

    // Calculate current month's opening balance for each customer
    // Use same logic as balance sheet report: fetch all data, then filter client-side
    // This ensures IST date format is handled correctly (Dec 1 IST = Nov 30 18:30 UTC in DB)
    const { getCurrentDateIST } = await import("@/lib/date-utils");
    const istNow = getCurrentDateIST();
    const monthStartDate = new Date(
      istNow.getFullYear(),
      istNow.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
    const monthStartIstString = monthStartDate.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    // Get all customer IDs
    const customerIds = customers.map(c => c.id);

    // Fetch all credits and payments (no date filter - we'll filter client-side like balance sheet)
    // Fetch last 12 months to ensure we have enough data
    const twelveMonthsAgo = new Date(istNow);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const [allCredits, allPayments] = await Promise.all([
      prisma.credit.findMany({
        where: {
          customerId: { in: customerIds },
          date: { gte: twelveMonthsAgo }
        },
        select: {
          customerId: true,
          amount: true,
          date: true
        }
      }),
      prisma.customerPayment.findMany({
        where: {
          customerId: { in: customerIds },
          paidOn: { gte: twelveMonthsAgo }
        },
        select: {
          customerId: true,
          amount: true,
          paidOn: true
        }
      })
    ]);

    // Filter credits and payments before month start (client-side, same as balance sheet)
    // This handles IST date format correctly by comparing IST calendar dates
    const creditsBeforeMonth = allCredits.filter((credit) => {
      if (!credit.customerId) return false;
      const creditIstDateString = new Date(credit.date).toLocaleDateString(
        "en-CA",
        { timeZone: "Asia/Kolkata" }
      );
      return creditIstDateString < monthStartIstString;
    });

    const paymentsBeforeMonth = allPayments.filter((payment) => {
      if (!payment.customerId) return false;
      const paymentIstDateString = new Date(payment.paidOn).toLocaleDateString(
        "en-CA",
        { timeZone: "Asia/Kolkata" }
      );
      return paymentIstDateString < monthStartIstString;
    });

    // Group credits and payments by customer
    const creditsByCustomer = new Map<string, number>();
    creditsBeforeMonth.forEach(credit => {
      if (credit.customerId) {
        const current = creditsByCustomer.get(credit.customerId) || 0;
        creditsByCustomer.set(credit.customerId, current + (credit.amount || 0));
      }
    });

    const paymentsByCustomer = new Map<string, number>();
    paymentsBeforeMonth.forEach(payment => {
      if (payment.customerId) {
        const current = paymentsByCustomer.get(payment.customerId) || 0;
        paymentsByCustomer.set(payment.customerId, current + (payment.amount || 0));
      }
    });

    // Calculate opening balance for current month for each customer
    const customersWithCalculatedOpening = customers.map(customer => {
      const creditsBefore = creditsByCustomer.get(customer.id) || 0;
      const paymentsBefore = paymentsByCustomer.get(customer.id) || 0;
      const calculatedOpeningBalance = (customer.openingBalance || 0) + creditsBefore - paymentsBefore;
      
      return {
        ...customer,
        calculatedOpeningBalance // Add calculated opening balance for current month
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({ 
      data: customersWithCalculatedOpening,
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
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}