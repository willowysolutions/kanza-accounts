// app/api/meterreadings/bulk/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// -----------------------------
// Zod schemas
// -----------------------------
const readingSchema = z.object({
  nozzleId: z.string(),
  machineId: z.string().optional(),
  fuelType: z.string(),
  sale: z.coerce.number(),
  fuelRate: z.coerce.number().optional(),
  totalAmount: z.coerce.number(),
  openingReading: z.coerce.number(),
  closingReading: z.coerce.number(),
  date: z.coerce.date(),
});

const bulkSchema = z.object({
  items: z.array(readingSchema).min(1),
});

// -----------------------------
// Helper: retry wrapper for P2034 deadlocks
// -----------------------------
async function runWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2034" &&
      retries > 0
    ) {
      console.warn("Deadlock detected, retrying transaction...");
      return runWithRetry(fn, retries - 1);
    }
    throw e;
  }
}

// -----------------------------
// Route handler
// -----------------------------
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

    // -----------------------------
    // Prepare readings
    // -----------------------------
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

    // -----------------------------
    // Duplicate check (per nozzle per date)
    // -----------------------------
    for (const reading of readingsToCreate) {
      const exists = await prisma.meterReading.findFirst({
        where: {
          nozzleId: reading.nozzleId,
          date: {
            gte: new Date(new Date(reading.date).setHours(0, 0, 0, 0)),
            lt: new Date(new Date(reading.date).setHours(23, 59, 59, 999)),
          },
        },
      });

      if (exists) {
        return NextResponse.json(
          { error: `Reading already exists for nozzle ${reading.nozzleId}` },
          { status: 400 }
        );
      }
    }

    // -----------------------------
    // 1. Pre-validate stock availability and collect update data
    // -----------------------------
    const tankUpdates = new Map<string, number>();
    const stockUpdates = new Map<string, number>();
    const nozzleUpdates = new Map<string, number>();

    for (const reading of readingsToCreate) {
      // Find nozzle and connected tank
      const nozzleWithTank = await prisma.nozzle.findUnique({
        where: { id: reading.nozzleId },
        include: {
          machine: {
            include: {
              machineTanks: { include: { tank: true } },
            },
          },
        },
      });

      const connectedTank = nozzleWithTank?.machine?.machineTanks.find(
        (mt) => mt.tank?.fuelType === reading.fuelType
      )?.tank;

      if (connectedTank) {
        // Check tank level
        if (connectedTank.currentLevel - reading.difference < 0) {
          return NextResponse.json(
            { error: `Tank does not have sufficient current level for ${reading.fuelType}` },
            { status: 400 }
          );
        }

        // Check stock availability
        const stock = await prisma.stock.findUnique({
          where: { item: reading.fuelType },
        });

        if (!stock || stock.quantity - reading.difference < 0) {
          return NextResponse.json(
            { error: `Stock not available for ${reading.fuelType}` },
            { status: 400 }
          );
        }

        // Accumulate tank updates
        const currentTankUpdate = tankUpdates.get(connectedTank.id) || 0;
        tankUpdates.set(connectedTank.id, currentTankUpdate + reading.difference);

        // Accumulate stock updates
        const currentStockUpdate = stockUpdates.get(reading.fuelType) || 0;
        stockUpdates.set(reading.fuelType, currentStockUpdate + reading.difference);
      }

      // Accumulate nozzle updates
      nozzleUpdates.set(reading.nozzleId, reading.closingReading);
    }

    // -----------------------------
    // 2. Process everything in a single optimized transaction
    // -----------------------------
    await runWithRetry(async () => {
      return prisma.$transaction(async (tx) => {
        // Insert all readings
        await tx.meterReading.createMany({
          data: readingsToCreate,
        });

        // Batch update tanks (using pre-collected data)
        for (const [tankId, totalDifference] of tankUpdates) {
          await tx.tank.update({
            where: { id: tankId },
            data: { currentLevel: { decrement: totalDifference } },
          });
        }

        // Batch update stocks (using pre-collected data)
        for (const [fuelType, totalDifference] of stockUpdates) {
          await tx.stock.update({
            where: { item: fuelType },
            data: { quantity: { decrement: totalDifference } },
          });
        }

        // Batch update nozzles (using pre-collected data)
        for (const [nozzleId, closingReading] of nozzleUpdates) {
          await tx.nozzle.update({
            where: { id: nozzleId },
            data: { openingReading: closingReading },
          });
        }
      }, {
        timeout: 15000, // Increase timeout to 15 seconds
      });
    });

    // -----------------------------
    // Revalidate cache
    // -----------------------------
    revalidatePath("/meterreadings");

    return NextResponse.json({
      ok: true,
      count: readingsToCreate.length,
    });
  } catch (error) {
    console.error("Error creating batch Meter Readings:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}