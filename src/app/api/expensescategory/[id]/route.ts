import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { expenseCategorySchemaWithId } from "@/schemas/expense-category-schema";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const parsed = expenseCategorySchemaWithId.safeParse({ id: (await params).id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    const expenseCategory = await prisma.expenseCategory.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: expenseCategory }, { status: 200 });
  } catch (error) {
    console.error("Error updating expense sategory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

//DELETE
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid ID format" },
      { status: 400 }
    );
  }

  try {
    const deletedExpenseCategory = await prisma.expenseCategory.delete({
      where: { id },
    });

    return NextResponse.json({ data: deletedExpenseCategory }, { status: 200 });
  } catch (error) {
    console.error("Error deleting expense category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
