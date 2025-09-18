import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { creditSchemaWithId } from "@/schemas/credit-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;


export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = creditSchemaWithId.safeParse({ id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { id: _omitId, ...data } = parsed.data;
    void _omitId;

    const existingCredit = await prisma.credit.findUnique({ where: { id } });
    if (!existingCredit) {
      return NextResponse.json({ error: "Credit not found" }, { status: 404 });
    }

    const oldAmount = existingCredit.amount;
    const newAmount = data.amount;
    const difference = newAmount - oldAmount; // +ve = credit increased, -ve = credit decreased
    const creditDate = new Date(existingCredit.date);

    const [updatedCredit] = await prisma.$transaction(async (tx) => {
      // 1. Update credit record
      const updated = await tx.credit.update({
        where: { id },
        data,
      });

      // 2. Adjust customer outstanding
      if (difference !== 0) {
        if (difference > 0) {
          // credit increased → customer owes more
          await tx.customer.update({
            where: { id: existingCredit.customerId },
            data: { outstandingPayments: { increment: difference } },
          });
        } else {
          // credit decreased → reduce customer outstanding
          await tx.customer.update({
            where: { id: existingCredit.customerId },
            data: { outstandingPayments: { decrement: Math.abs(difference) } },
          });
        }
      }

      // 3. Adjust BalanceReceipt (cash effect)
      const existingReceipt = await tx.balanceReceipt.findFirst({
        where: {
          branchId: existingCredit.branchId,
          date: {
            gte: new Date(creditDate.setHours(0, 0, 0, 0)),
            lte: new Date(creditDate.setHours(23, 59, 59, 999)),
          },
        },
      });

      if (existingReceipt && difference !== 0) {
        if (difference > 0) {
          // more credit → branch cash decreases
          await tx.balanceReceipt.update({
            where: { id: existingReceipt.id },
            data: { amount: { decrement: difference } },
          });
        } else {
          // less credit → branch cash increases
          await tx.balanceReceipt.update({
            where: { id: existingReceipt.id },
            data: { amount: { increment: Math.abs(difference) } },
          });
        }
      }

      return [updated];
    });

    return NextResponse.json({ data: updatedCredit }, { status: 200 });
  } catch (error) {
    console.error("Error updating credit:", error);
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
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  try {
    const existingCredit = await prisma.credit.findUnique({
      where: { id },
    });

    if (!existingCredit) {
      return NextResponse.json({ error: "Credit not found" }, { status: 404 });
    }

    const creditDate = new Date(existingCredit.date);

    const [deletedCredit] = await prisma.$transaction(async (tx) => {
      // 1. Delete credit
      const removedCredit = await tx.credit.delete({ where: { id } });

      // 2. Adjust customer outstanding
      await tx.customer.update({
        where: { id: existingCredit.customerId },
        data: { outstandingPayments: { decrement: existingCredit.amount } },
      });

      // 3. Increment back in BalanceReceipt (undo earlier decrement)
      const existingReceipt = await tx.balanceReceipt.findFirst({
        where: {
          branchId: existingCredit.branchId,
          date: {
            gte: new Date(creditDate.setHours(0, 0, 0, 0)),
            lte: new Date(creditDate.setHours(23, 59, 59, 999)),
          },
        },
      });

      if (existingReceipt) {
        await tx.balanceReceipt.update({
          where: { id: existingReceipt.id },
          data: { amount: { increment: existingCredit.amount } },
        });
      }

      return [removedCredit];
    });

    return NextResponse.json({ data: deletedCredit }, { status: 200 });
  } catch (error) {
    console.error("Error deleting credit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
