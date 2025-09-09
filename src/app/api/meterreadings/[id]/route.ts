import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { meterReadingSchemaWithId } from "@/schemas/meter-reading-schema";
import { ObjectId } from "mongodb";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = meterReadingSchemaWithId.safeParse({ id: params.id, ...body });


    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

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

    const difference =
      (data.closingReading ?? existingReading.closingReading) -
      (data.openingReading ?? existingReading.openingReading);

    const updatedReading = await prisma.meterReading.update({
      where: { id },
      data: {
        ...data,
        difference,
      },
    });

    // Adjust tank stock if difference changed
    const oldDiff = existingReading.closingReading - existingReading.openingReading;
    const newDiff = difference;
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
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!ObjectId.isValid(id)) {
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
