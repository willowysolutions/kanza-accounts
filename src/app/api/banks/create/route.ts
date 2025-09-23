import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { bankSchema } from "@/schemas/bank-schema";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Zod validation
    const result = bankSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }    

    const banks = await prisma.bank.create({
      data: {
        ...result.data,
      },
    });
      revalidatePath("/banks");
    return NextResponse.json({ data: banks }, { status: 201 });
  } catch (error) {
    console.error("Error creating banks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




