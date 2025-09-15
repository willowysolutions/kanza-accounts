import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { meterReadingSchemaWithId } from "@/schemas/meter-reading-schema";
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
    const parsed = meterReadingSchemaWithId.safeParse({ id, ...body });


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
