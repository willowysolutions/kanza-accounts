import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { balanceReceiptSchema } from "@/schemas/balance-receipt";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Zod validation
    const result = balanceReceiptSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }    

    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch;

    const balanceReceipts = await prisma.balanceReceipt.create({
      data: {
        ...result.data,
        branchId
      },
    });
      revalidatePath("/balance-receipts");
    return NextResponse.json({ data: balanceReceipts }, { status: 201 });
  } catch (error) {
    console.error("Error creating balance Receipts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




