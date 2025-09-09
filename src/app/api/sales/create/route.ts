import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { salesSchema } from "@/schemas/sales-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ✅ Validate with Zod
    const result = salesSchema.safeParse(body);
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

    // ✅ Just create sale record — no stock update
    const sale = await prisma.sale.create({
      data: {
        ...result.data,
        branchId,
      },
    });

    revalidatePath("/sales");
    return NextResponse.json({ data: sale }, { status: 201 });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
