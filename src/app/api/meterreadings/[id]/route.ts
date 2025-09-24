import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { meterReadingUpdateSchema } from "@/schemas/meter-reading-schema";
import { ObjectId } from "mongodb";

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
    const parsed = meterReadingUpdateSchema.safeParse({ id, ...body });


    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { id: _omitId, ...data } = parsed.data; void _omitId;

    // Get the existing meter reading row
    const existingReading = await prisma.meterReading.findUnique({
      where: { id },
      include: {
        nozzle: {
          include: {
            machine: {
              include: {
                machineTanks: { include: { tank: true } }
              }
            }
          }
        }
      }
    });

    if (!existingReading) {
      return NextResponse.json({ error: "Meter reading not found" }, { status: 404 });
    }

    // Calculate new difference if closing or opening reading changed
    const newOpeningReading = data.openingReading ?? existingReading.openingReading;
    const newClosingReading = data.closingReading ?? existingReading.closingReading;
    const newDifference = newClosingReading - newOpeningReading;

    // Prepare update data, only including fields that were provided
    const updateData: {
      nozzleId?: string;
      openingReading?: number;
      closingReading?: number;
      totalAmount?: number;
      date?: Date;
      difference: number;
    } = {
      difference: newDifference,
    };
    
    if (data.nozzleId !== undefined) updateData.nozzleId = data.nozzleId;
    if (data.openingReading !== undefined) updateData.openingReading = data.openingReading;
    if (data.closingReading !== undefined) updateData.closingReading = data.closingReading;
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
    if (data.date !== undefined) updateData.date = data.date;

    const updatedReading = await prisma.meterReading.update({
      where: { id },
      data: updateData,
    });

    // Adjust tank stock if difference changed
    const oldDiff = existingReading.closingReading - existingReading.openingReading;
    const newDiff = newDifference;
    const qtyChange = newDiff - oldDiff;

    const connectedTank = existingReading.nozzle?.machine?.machineTanks.find(
      (mt) => mt.tank?.fuelType === existingReading.nozzle?.fuelType
    )?.tank;

    if (connectedTank && qtyChange !== 0) {
      await prisma.tank.update({
        where: { id: connectedTank.id },
        data: {
          currentLevel:
            qtyChange > 0
              ? { decrement: qtyChange }
              : { increment: Math.abs(qtyChange) },
        },
      });
    }

    return NextResponse.json({ data: updatedReading }, { status: 200 });
  } catch (error) {
    console.error("Error updating meter reading:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function DELETE(
  _req: Request,
  context: unknown
) {
  const params = (context as { params?: { id?: string } })?.params ?? {};
  const id = typeof params.id === "string" ? params.id : null;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  try {
    const meterReadingDelete = await prisma.meterReading.delete({
      where: { id },
    });

    return NextResponse.json({ data: meterReadingDelete }, { status: 200 });
  } catch (error) {
    console.error("Error deleting meter reading:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
