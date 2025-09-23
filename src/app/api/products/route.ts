import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const product = await prisma.product.findMany({
      orderBy: { productName: "asc" },
      select: {
        id: true,
        productName: true,
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