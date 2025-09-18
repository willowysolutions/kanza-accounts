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

    const branchId = session?.user?.branch;


    const { productType, quantity, ...rest } = result.data;

    // create oil record
    const oil = await prisma.oil.create({
      data: {
        productType,
        quantity,
        branchId,
        ...rest,
      },
    });

    // decrement stock for that oil product
    await prisma.stock.update({
      where: { item: productType },
      data: {
        quantity: {
          decrement: quantity,
        },
      },
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
