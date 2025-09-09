// src/app/api/reports/meter/route.ts
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch;
    const whereClause = session?.user?.role === "admin" ? {} : { branchId };

    // Fetch all meter readings (for sales report, grouped by date + fuelType)
    const meterReadings = await prisma.meterReading.findMany({
      where: whereClause,
      select: {
        date: true,
        fuelType: true, 
        openingReading: true,
        closingReading: true,
        sale: true,
        difference: true,
        totalAmount: true,
      },
      orderBy: { date: "desc" },
    });

    // Group by date + fuelType
    const reportMap = new Map<
      string,
      {
        [fuelType: string]: {
          openingReading: number;
          closingReading: number;
          sale: number;
          difference: number;
          totalAmount: number;
        };
      }
    >();

    meterReadings.forEach((r) => {
      const d = r.date.toISOString().split("T")[0];
      const existing = reportMap.get(d) || {};
      const existingFuel = existing[r.fuelType] || {
        openingReading: 0,
        closingReading: 0,
        sale: 0,
        difference: 0,
        totalAmount: 0,
      };

      reportMap.set(d, {
        ...existing,
        [r.fuelType]: {
          openingReading: existingFuel.openingReading + (r.openingReading || 0),
          closingReading: existingFuel.closingReading + (r.closingReading || 0),
          sale: existingFuel.sale + (r.sale || 0),
          difference: existingFuel.difference + (r.difference || 0),
          totalAmount: existingFuel.totalAmount + (r.totalAmount || 0),
        },
      });
    });

    // Convert to array
    const rows = Array.from(reportMap.entries()).map(([date, products]) => ({
      date,
      products: Object.entries(products).map(([fuelType, v]) => ({
        fuelType,
        openingReading: v.openingReading,
        closingReading: v.closingReading,
        sale: v.sale,
        difference: v.difference,
        totalAmount: v.totalAmount,
      })),
    }));

    // Sort by date (latest first)
    rows.sort((a, b) => (a.date < b.date ? 1 : -1));

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Error in meter report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
