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
    const newDifference = Number(
      (newClosingReading - newOpeningReading).toFixed(2)
    );

    // Calculate new sale and total amount if closing reading changed
    let newSale = existingReading.sale;
    let newTotalAmount = existingReading.totalAmount;
    
    if (data.closingReading !== undefined) {
      // Calculate new sale based on difference change
      const oldDiff = existingReading.closingReading - existingReading.openingReading;
      const saleChange = newDifference - oldDiff;
      newSale = Math.max(0, existingReading.sale + saleChange);
      
      // Calculate new total amount based on fuel rate
      const fuelRate = existingReading.fuelRate || 0;
      newTotalAmount = Math.round(newDifference * fuelRate);
    }

    // Prepare update data, only including fields that were provided
    const updateData: {
      nozzleId?: string;
      openingReading?: number;
      closingReading?: number;
      sale?: number;
      totalAmount?: number;
      date?: Date;
      difference: number;
    } = {
      difference: newDifference,
    };
    
    if (data.nozzleId !== undefined) updateData.nozzleId = data.nozzleId;
    if (data.openingReading !== undefined) updateData.openingReading = data.openingReading;
    if (data.closingReading !== undefined) {
      updateData.closingReading = data.closingReading;
      updateData.sale = newSale;
      updateData.totalAmount = newTotalAmount;
    }
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
    if (data.date !== undefined) {
      // Preserve the time as 18:30:00.000+00:00 (6:30 PM UTC)
      const date = new Date(data.date);
      date.setUTCHours(18, 30, 0, 0); // Set to 18:30:00.000 UTC
      updateData.date = date;
    }

    // Check for duplicate if date or nozzleId is being updated
    if (data.date !== undefined || data.nozzleId !== undefined) {
      const finalNozzleId = data.nozzleId ?? existingReading.nozzleId;
      const finalDate = data.date !== undefined ? updateData.date : existingReading.date;
      
      if (finalDate) {
        // Create date range for the day
        const startOfDay = new Date(finalDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(finalDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        
        const duplicate = await prisma.meterReading.findFirst({
          where: {
            nozzleId: finalNozzleId,
            date: {
              gte: startOfDay,
              lt: endOfDay,
            },
            id: { not: id }, // Exclude current record
          },
        });

        if (duplicate) {
          return NextResponse.json(
            { error: `A meter reading already exists for this nozzle on ${finalDate.toLocaleDateString()}` },
            { status: 400 }
          );
        }
      }
    }

    // Update the meter reading
    const updatedReading = await prisma.meterReading.update({
      where: { id },
      data: updateData,
    });

    // Calculate changes for tank, stock, and nozzle updates
    const oldDiff = existingReading.closingReading - existingReading.openingReading;
    const newDiff = newDifference;
    const qtyChange = newDiff - oldDiff;

    // Get connected tank and fuel type
    const connectedTank = existingReading.nozzle?.machine?.machineTanks.find(
      (mt) => mt.tank?.fuelType === existingReading.nozzle?.fuelType
    )?.tank;

    const fuelType = existingReading.nozzle?.fuelType;

    // Update operations array
    const updateOperations = [];

    // 1. Update nozzle opening reading to new closing reading
    if (data.closingReading !== undefined) {
      updateOperations.push(
        prisma.nozzle.update({
          where: { id: existingReading.nozzleId },
          data: { openingReading: newClosingReading },
        })
      );
    }

    // 2. Update tank current level if difference changed
    if (connectedTank && qtyChange !== 0) {
      updateOperations.push(
        prisma.tank.update({
          where: { id: connectedTank.id },
          data: {
            currentLevel:
              qtyChange > 0
                ? { decrement: qtyChange }
                : { increment: Math.abs(qtyChange) },
          },
        })
      );
    }

    // 3. Update stock quantity if difference changed
    if (fuelType && qtyChange !== 0 && existingReading.branchId) {
      // If decreasing stock, validate availability first
      if (qtyChange > 0) {
        const stock = await prisma.stock.findFirst({
          where: {
            item: fuelType,
            branchId: existingReading.branchId,
          },
        });

        if (!stock) {
          return NextResponse.json(
            { error: `Stock not found for ${fuelType} in this branch` },
            { status: 400 }
          );
        }

        if (stock.quantity - qtyChange < 0) {
          return NextResponse.json(
            { error: `No stock available for ${fuelType}. Available: ${stock.quantity.toFixed(2)}L, Required: ${qtyChange.toFixed(2)}L` },
            { status: 400 }
          );
        }
      }

      updateOperations.push(
        prisma.stock.updateMany({
          where: { 
            item: fuelType,
            branchId: existingReading.branchId, // CRITICAL: Only update stock for this branch
          },
          data: {
            quantity:
              qtyChange > 0
                ? { decrement: qtyChange }
                : { increment: Math.abs(qtyChange) },
          },
        })
      );
    }

    // Execute all updates in parallel
    if (updateOperations.length > 0) {
      await Promise.all(updateOperations);
      console.log(`Updated meter reading ${id} and related records`);
    }

    return NextResponse.json({ data: updatedReading }, { status: 200 });
  } catch (error) {
    console.error("Error updating meter reading:", error);
    
    // Handle unique constraint error
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { error: "A meter reading already exists for this nozzle on the selected date" },
        { status: 400 }
      );
    }
    
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
    // Get the meter reading with related data BEFORE deleting
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

    // Calculate the difference to restore
    const difference = existingReading.closingReading - existingReading.openingReading;
    const fuelType = existingReading.fuelType;
    const branchId = existingReading.branchId;

    // Get connected tank
    const connectedTank = existingReading.nozzle?.machine?.machineTanks.find(
      (mt) => mt.tank?.fuelType === fuelType
    )?.tank;

    // Delete the meter reading
    const meterReadingDelete = await prisma.meterReading.delete({
      where: { id },
    });

    // Restore stock and tank level for the specific branch
    const restoreOperations = [];

    // 1. Restore tank current level
    if (connectedTank && difference > 0) {
      restoreOperations.push(
        prisma.tank.update({
          where: { id: connectedTank.id },
          data: {
            currentLevel: { increment: difference },
          },
        })
      );
    }

    // 2. Restore stock quantity for the specific branch only
    if (fuelType && branchId && difference > 0) {
      restoreOperations.push(
        prisma.stock.updateMany({
          where: {
            item: fuelType,
            branchId: branchId, // CRITICAL: Only restore stock for this branch
          },
          data: {
            quantity: { increment: difference },
          },
        })
      );
    }

    // Execute restore operations
    if (restoreOperations.length > 0) {
      await Promise.all(restoreOperations);
      console.log(`Restored stock ${fuelType} by ${difference} and tank level for branch ${branchId}`);
    }

    return NextResponse.json({ data: meterReadingDelete }, { status: 200 });
  } catch (error) {
    console.error("Error deleting meter reading:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
