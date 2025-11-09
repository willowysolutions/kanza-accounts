import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const whereClause = branchId ? { branchId } : {};

    const product = await prisma.product.findMany({
      where: whereClause,
      orderBy: { productName: "asc" },
      select: {
        id: true,
        productName: true,
        productCategory: true,
        productUnit: true,
        purchasePrice: true,
        sellingPrice: true,
        branchId: true,
      },
    });

    return NextResponse.json({ data: product }, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}