import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// GET /api/stocks/product-history?branchId=...&productName=...&from=...&to=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const productName = searchParams.get("productName") || undefined;
    const requestedBranchId = searchParams.get("branchId") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    if (!productName) {
      return NextResponse.json(
        { history: [], error: "productName is required" },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json(
        { history: [], error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Determine branch scope: explicit branchId query wins, otherwise session branch
    const branchId =
      requestedBranchId ||
      (typeof session.user.branch === "string" ? session.user.branch : undefined);

    // Date range (optional, but normally the month from stock-report page)
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) {
        dateFilter.gte = fromDate;
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) {
        dateFilter.lte = toDate;
      }
    }

    // Helper to build where with optional branch + date
    const buildWhere = (extra: Record<string, unknown>) => ({
      ...(branchId ? { branchId } : {}),
      ...extra,
      ...(dateFilter.gte || dateFilter.lte ? { date: dateFilter } : {}),
    });

    // Fetch purchases for this product
    const purchases = await prisma.purchase.findMany({
      where: buildWhere({ productType: productName }),
      select: {
        date: true,
        quantity: true,
      },
      orderBy: { date: "asc" },
    });

    // Fetch meter readings (fuel sales) for this product
    const meterReadings = await prisma.meterReading.findMany({
      where: buildWhere({ fuelType: productName }),
      select: {
        date: true,
        sale: true,
      },
      orderBy: { date: "asc" },
    });

    // Fetch oil sales (other products) for this product
    const oilSales = await prisma.oil.findMany({
      where: buildWhere({ productType: productName }),
      select: {
        date: true,
        quantity: true,
      },
      orderBy: { date: "asc" },
    });

    // Group by calendar date (YYYY-MM-DD)
    const historyMap = new Map<
      string,
      {
        date: Date;
        purchaseQty: number;
        saleQty: number;
      }
    >();

    const upsert = (date: Date) => {
      const key = date.toISOString().split("T")[0];
      if (!historyMap.has(key)) {
        historyMap.set(key, {
          date,
          purchaseQty: 0,
          saleQty: 0,
        });
      }
      return historyMap.get(key)!;
    };

    purchases.forEach((p) => {
      const entry = upsert(p.date);
      entry.purchaseQty += p.quantity || 0;
    });

    meterReadings.forEach((m) => {
      const entry = upsert(m.date);
      entry.saleQty += m.sale || 0;
    });

    oilSales.forEach((o) => {
      const entry = upsert(o.date);
      entry.saleQty += o.quantity || 0;
    });

    const history = Array.from(historyMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    console.error("Error fetching stock product history:", error);
    return NextResponse.json(
      { history: [], error: "Internal server error" },
      { status: 500 }
    );
  }
}


