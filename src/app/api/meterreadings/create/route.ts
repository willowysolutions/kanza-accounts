import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

// NEW: schema for batch meter readings
const batchMeterReadingSchema = z.object({
  date: z.string(), // date of readings
  shift: z.string(),
  machines: z.array(
    z.object({
      machineId: z.string(),
      nozzles: z.array(
        z.object({
          nozzleId: z.string(),
          fuelType: z.string(),
          openingReading: z.number(),
          closingReading: z.number(),
          sale:z.number(),
        })
      ),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = batchMeterReadingSchema.safeParse(body);
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

    // Preserve the time as 18:30:00.000+00:00 (6:30 PM UTC)
    const readingDate = new Date(result.data.date);
    readingDate.setUTCHours(18, 30, 0, 0); // Set to 18:30:00.000 UTC

    const createdReadings = [];

    for (const machine of result.data.machines) {
      for (const nozzle of machine.nozzles) {
        const difference = nozzle.closingReading - nozzle.openingReading;

        // store opening reading
        const opening = await prisma.meterReading.create({
          data: {
            nozzleId: nozzle.nozzleId,
            branchId,
            fuelType: nozzle.fuelType,
            openingReading: nozzle.openingReading,
            closingReading:nozzle.closingReading,
            date: readingDate,
            sale:nozzle.sale,
            difference: null,
            totalAmount:0,
          },
        });

        // store closing reading
        const closing = await prisma.meterReading.create({
          data: {
            nozzleId: nozzle.nozzleId,
            branchId,
            fuelType: nozzle.fuelType,
            openingReading:nozzle.openingReading,
            closingReading: nozzle.closingReading,
            date: readingDate,
            sale:nozzle.sale,
            difference,
            totalAmount:0,
          },
        });

        createdReadings.push(opening, closing);

        // adjust tank stock (for closing reading only)
        const nozzleWithTank = await prisma.nozzle.findUnique({
          where: { id: nozzle.nozzleId },
          include: {
            machine: {
              include: {
                machineTanks: {
                  include: { tank: true },
                },
              },
            },
          },
        });

        if (nozzleWithTank) {
          const connectedTank = nozzleWithTank.machine?.machineTanks.find(
            (mt) => mt.tank?.fuelType === nozzleWithTank.fuelType
          )?.tank;

          if (connectedTank) {

            // check if stock is enough
            if (connectedTank.currentLevel - difference < 0) {
              throw new Error("Tank does not have sufficient current level"); 
            }
              // ✅ Safe to decrement
              await prisma.tank.update({
                where: { id: connectedTank.id },
                data: {
                  currentLevel: {
                    decrement: difference,
                  },
                },
              });
          }
        }
      }
    }

    revalidatePath("/meter-reading");

    return NextResponse.json({ data: createdReadings }, { status: 201 });
  } catch (error) {
    console.error("Error creating batch Meter Readings:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
