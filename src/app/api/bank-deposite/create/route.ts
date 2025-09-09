import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { bankDepositeSchema } from "@/schemas/bank-deposite-schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Zod validation
    const result = bankDepositeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }    

    const bankDeposite = await prisma.bankDeposite.create({
      data: result.data,
    });

    await prisma.bank.update({
        where:{id:result.data?.bankId},
        data:{
            balanceAmount:{
                increment:result.data?.amount
            }
        }
    })
      revalidatePath("/bank-deposite");
    return NextResponse.json({ data: bankDeposite }, { status: 201 });
  } catch (error) {
    console.error("Error creating bankdeposite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




