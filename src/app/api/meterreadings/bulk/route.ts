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
  branchId: z.string().optional(),
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
    
    const body = await req.json();
    const parsed = bulkSchema.safeParse(body);
    
    // Use branchId from request body, fallback to session branch
    // IMPORTANT: branchId is required - if undefined, we cannot proceed
    const branchId = body.branchId || session?.user?.branch || undefined;
    
    // Validate that branchId is set - required for stock/tank updates
    if (!branchId) {
      return NextResponse.json(
        { error: "Branch ID is required. Please select a branch." },
        { status: 400 }
      );
    }

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

      // Preserve the time as 18:30:00.000+00:00 (6:30 PM UTC)
      const date = new Date(reading.date);
      date.setUTCHours(18, 30, 0, 0); // Set to 18:30:00.000 UTC

      return {
        ...reading,
        date,
        difference,
        totalAmount,
        branchId,
      };
    });

    // -----------------------------
    // Duplicate check (per nozzle per date) - prevent same nozzle from having duplicate readings on same date
    // Multiple nozzles can have readings on the same date, but same nozzle cannot have duplicate readings
    // -----------------------------
    for (const reading of readingsToCreate) {
      const existingReading = await prisma.meterReading.findFirst({
        where: {
          nozzleId: reading.nozzleId,
          branchId,
          date: {
            gte: new Date(new Date(reading.date).setHours(0, 0, 0, 0)),
            lt: new Date(new Date(reading.date).setHours(23, 59, 59, 999)),
          },
        },
      });

      if (existingReading) {
        return NextResponse.json(
          { error: `A meter reading already exists for this nozzle on this date.` },
          { status: 400 }
        );
      }
    }

    // -----------------------------
    // Date validation - prevent present/future dates
    // -----------------------------
    const { getCurrentDateIST } = await import("@/lib/date-utils");
    const currentDate = getCurrentDateIST();
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    
    for (const reading of readingsToCreate) {
      const readingDate = new Date(reading.date);
      const readingDateOnly = new Date(readingDate.getFullYear(), readingDate.getMonth(), readingDate.getDate());
      
      if (readingDateOnly >= currentDateOnly) {
        return NextResponse.json(
          { error: "Cannot store meter reading for present or future dates. Only past dates are allowed." },
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

    // Group readings by fuelType to calculate total sales per fuel type
    const salesByFuelType = new Map<string, number>();
    for (const reading of readingsToCreate) {
      const currentSale = salesByFuelType.get(reading.fuelType) || 0;
      salesByFuelType.set(reading.fuelType, currentSale + reading.difference);
    }

    // Validate stock availability for each fuel type
    for (const [fuelType, totalSale] of salesByFuelType.entries()) {
      const stock = await prisma.stock.findFirst({
        where: { 
          item: fuelType,
          branchId: branchId
        },
      });

      if (!stock) {
        return NextResponse.json(
          { error: `Stock not found for ${fuelType}` },
          { status: 400 }
        );
      }

      if (stock.quantity - totalSale < 0) {
        return NextResponse.json(
          { error: `Insufficient stock for ${fuelType}. Available: ${stock.quantity.toFixed(2)}L, Required: ${totalSale.toFixed(2)}L` },
          { status: 400 }
        );
      }
    }

    // Validate tank levels for each reading
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
        // Check tank level - use accumulated updates for this tank
        const currentTankUpdate = tankUpdates.get(connectedTank.id) || 0;
        const newTankLevel = connectedTank.currentLevel - currentTankUpdate - reading.difference;
        
        if (newTankLevel < 0) {
          return NextResponse.json(
            { error: `Tank "${connectedTank.tankName}" does not have sufficient current level for ${reading.fuelType}. Available: ${(connectedTank.currentLevel - currentTankUpdate).toFixed(2)}L, Required: ${reading.difference.toFixed(2)}L` },
            { status: 400 }
          );
        }

        // Accumulate tank updates
        tankUpdates.set(connectedTank.id, currentTankUpdate + reading.difference);

        // Accumulate stock updates
        const currentStockUpdate = stockUpdates.get(reading.fuelType) || 0;
        stockUpdates.set(reading.fuelType, currentStockUpdate + reading.difference);
      }

      // Accumulate nozzle updates
      nozzleUpdates.set(reading.nozzleId, reading.closingReading);
    }

    // -----------------------------
    // 2. Process in separate transactions to avoid timeout
    // -----------------------------
    
    console.log(`Processing ${readingsToCreate.length} meter readings...`);
    
    // First: Insert meter readings only
    await runWithRetry(async () => {
      return prisma.$transaction(async (tx) => {
        await tx.meterReading.createMany({
          data: readingsToCreate,
        });
      }, {
        timeout: 60000, // 60 seconds for insert
      }); 
    });
    
    console.log(`Successfully created ${readingsToCreate.length} meter readings`);

    // Second: Update tanks in parallel
    const tankUpdatePromises = Array.from(tankUpdates.entries()).map(
      async ([tankId, totalDifference]) => {
        try {
          await prisma.tank.update({
            where: { id: tankId },
            data: { currentLevel: { decrement: totalDifference } },
          });
          console.log(`Updated tank ${tankId} by ${totalDifference}`);
        } catch (error) {
          console.error(`Failed to update tank ${tankId}:`, error);
          throw error;
        }
      }
    );

    // Third: Update stocks in parallel - ONLY for the specified branch
    const stockUpdatePromises = Array.from(stockUpdates.entries()).map(
      async ([fuelType, totalDifference]) => {
        try {
          // CRITICAL: Ensure branchId is explicitly set to prevent updating all branches
          const updateResult = await prisma.stock.updateMany({
            where: { 
              item: fuelType,
              branchId: branchId // Explicitly require branchId - must not be undefined
            },
            data: { quantity: { decrement: totalDifference } },
          });
          console.log(`Updated stock ${fuelType} by ${totalDifference} for branch ${branchId} (${updateResult.count} records updated)`);
          
          // Verify that exactly one stock record was updated (safety check)
          if (updateResult.count === 0) {
            console.warn(`Warning: No stock record found for ${fuelType} in branch ${branchId}`);
          } else if (updateResult.count > 1) {
            console.error(`ERROR: Multiple stock records updated for ${fuelType} in branch ${branchId}! This should not happen.`);
            throw new Error(`Multiple stock records found for ${fuelType} in branch ${branchId}`);
          }
        } catch (error) {
          console.error(`Failed to update stock ${fuelType} for branch ${branchId}:`, error);
          throw error;
        }
      }
    );

    // Execute tank and stock updates in parallel
    await Promise.all([...tankUpdatePromises, ...stockUpdatePromises]);

    // Fourth: Update nozzles in batches to avoid timeout
    const nozzleUpdatePromises = Array.from(nozzleUpdates.entries()).map(
      async ([nozzleId, closingReading]) => {
        try {
          await prisma.nozzle.update({
            where: { id: nozzleId },
            data: { openingReading: closingReading },
          });
          console.log(`Updated nozzle ${nozzleId} with opening reading ${closingReading}`);
        } catch (error) {
          console.error(`Failed to update nozzle ${nozzleId}:`, error);
          throw error;
        }
      }
    );

    // Execute all nozzle updates in parallel
    console.log(`Updating ${nozzleUpdates.size} nozzles...`);
    await Promise.all(nozzleUpdatePromises);
    console.log(`Successfully updated ${nozzleUpdates.size} nozzles`);

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