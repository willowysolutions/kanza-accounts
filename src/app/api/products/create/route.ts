import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { productSchema } from "@/schemas/product-schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Zod validation
    const result = productSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }    

    const product = await prisma.product.create({
      data: result.data,
    });
      revalidatePath("/products");
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




