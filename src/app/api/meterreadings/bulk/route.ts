// app/api/meterreadings/bulk/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";


const readingSchema = z.object({
  nozzleId: z.string(),
  machineId: z.string().optional(),
  fuelType: z.string(),
  sale:z.coerce.number(),
  fuelRate: z.coerce.number().optional(),
  totalAmount:z.coerce.number(),
  openingReading: z.coerce.number(),
  closingReading: z.coerce.number(),
  date: z.coerce.date(),
});

const bulkSchema = z.object({
  items: z.array(readingSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch || undefined;

    const body = await req.json();
    const parsed = bulkSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Validation failed", parsed.error.format());
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Create readings in bulk
    const readingsToCreate = parsed.data.items.map((reading) => {
      const difference = Number(
        (reading.closingReading - reading.openingReading).toFixed(2)
      ); 

      const totalAmount =
        reading.fuelRate != null
          ? Math.round(difference * reading.fuelRate)
          : 0;

      return {
        ...reading,
        difference,
        totalAmount,  
        branchId,
      };
    });


    // Before createMany
    for (const reading of readingsToCreate) {
      const exists = await prisma.meterReading.findFirst({
        where: {
          nozzleId: reading.nozzleId,
          date: {
            gte: new Date(new Date(reading.date).setHours(0,0,0,0)),
            lt: new Date(new Date(reading.date).setHours(23,59,59,999))
          },
        },
      });

      if (exists) {
        return NextResponse.json(
          { error: `Reading already exists.` },
          { status: 400 }
        );
      }
    }


    await prisma.$transaction(async (tx) => {
      for (const reading of readingsToCreate) {
        // 1. create meter reading
        await tx.meterReading.create({
          data: reading,
        });

        // 2. find nozzle + connected tank
        const nozzleWithTank = await tx.nozzle.findUnique({
          where: { id: reading.nozzleId },
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
            (mt) => mt.tank?.fuelType === reading.fuelType
          )?.tank;

          if (connectedTank) {
            if (connectedTank.currentLevel - reading.difference < 0) {
              throw new Error("Tank does not have sufficient current level"); 
            }

            // 3. update tank
            await tx.tank.update({
              where: { id: connectedTank.id },
              data: {
                currentLevel: { decrement: reading.difference },
              },
            });

            // 4. update stock
            const stock = await tx.stock.findUnique({
              where: { item: reading.fuelType },
            });

            if (!stock) {
              throw new Error(`Stock not found for fuel type: ${reading.fuelType}`);
            }

            if (stock.quantity - reading.difference < 0) {
              throw new Error("No stock available");
            }

            await tx.stock.update({
              where: { item: reading.fuelType },
              data: {
                quantity: { decrement: reading.difference },
              },
            });
          }
        }

        // 5. update nozzle openingReading
        await tx.nozzle.update({
          where: { id: reading.nozzleId },
          data: {
            openingReading: reading.closingReading,
          },
        });
      }
    }, {
      timeout: 50000 
    });

    revalidatePath("/meterreadings");


    return NextResponse.json({ ok: true, count: readingsToCreate.length });
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
