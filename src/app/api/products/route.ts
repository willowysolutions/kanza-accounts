import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const product = await prisma.product.findMany({
      orderBy: { productName: "asc" },
      include: {
        branch: true,
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