import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { oilSchema } from "@/schemas/oil-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Zod validation
    const result = oilSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Use branchId from form data if provided, otherwise fall back to session branch
    const branchId = result.data.branchId || session?.user?.branch;

    const { productType, quantity, ...rest } = result.data;

    // Check if stock is available before creating the oil record
    const stock = await prisma.stock.findUnique({
      where: { item: productType },
    });

    if (!stock) {
      return NextResponse.json(
        { error: `No stock found for ${productType}` },
        { status: 400 }
      );
    }

    if (stock.quantity < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${stock.quantity}, Requested: ${quantity}` },
        { status: 400 }
      );
    }

    // Use transaction to ensure both operations succeed or fail together
    const [oil] = await prisma.$transaction(async (tx) => {
      // Create oil record
      const newOil = await tx.oil.create({
        data: {
          productType,
          quantity,
          branchId,
          ...rest,
        },
      });

      // Decrement stock for that oil product
      await tx.stock.update({
        where: { item: productType },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
      });

      return [newOil];
    });

    revalidatePath("/oils");
    return NextResponse.json({ data: oil }, { status: 201 });
  } catch (error) {
    console.error("Error creating oil:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
