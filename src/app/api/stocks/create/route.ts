import { NextRequest, NextResponse } from "next/server";
import { stockSchema } from "@/schemas/stock-schema";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

//create new stock

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = stockSchema.safeParse(body);
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

    const stock = await prisma.stock.create({
      data: {
        ...result.data,
        branchId
      },
    });
    
    revalidatePath("/stocks");

    return NextResponse.json({ data: stock }, { status: 201 });
  } catch (error) {
    console.error("Error creating stock:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

