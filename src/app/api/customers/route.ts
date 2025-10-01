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

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({ 
      data: customers,
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