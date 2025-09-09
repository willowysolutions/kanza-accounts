import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { expenseCategorySchema } from "@/schemas/expense-category-schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Zod validation
    const result = expenseCategorySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }    

    const expenseCategory = await prisma.expenseCategory.create({
      data: result.data,
    });
      revalidatePath("/expensescategory");
    return NextResponse.json({ data: expenseCategory }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




