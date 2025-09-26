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
    // 1. Pre-validate stock availability for ALL readings
    // -----------------------------
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
      }
    }

    // -----------------------------
    // 2. If all validations pass, process everything in a single transaction
    // -----------------------------
    await runWithRetry(async () => {
      return prisma.$transaction(async (tx) => {
        // Insert all readings
        await tx.meterReading.createMany({
          data: readingsToCreate,
        });

        // Process tanks & stocks
        for (const reading of readingsToCreate) {
          // Find nozzle and connected tank
          const nozzleWithTank = await tx.nozzle.findUnique({
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
            // Update tank level
            await tx.tank.update({
              where: { id: connectedTank.id },
              data: { currentLevel: { decrement: reading.difference } },
            });

            // Update stock
            await tx.stock.update({
              where: { item: reading.fuelType },
              data: { quantity: { decrement: reading.difference } },
            });
          }
        }

        // Update all nozzles with their closing readings
        for (const reading of readingsToCreate) {
          await tx.nozzle.update({
            where: { id: reading.nozzleId },
            data: { openingReading: reading.closingReading },
          });
        }
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
