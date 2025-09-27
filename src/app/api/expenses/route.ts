export const dynamic = "force-dynamic";
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

    // Get total count for pagination info
    const totalCount = await prisma.expense.count({
      where: whereClause,
    });

    // Get paginated expenses
    const expense = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      include:{category:true, branch:true},
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({ 
      data: expense,
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
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}