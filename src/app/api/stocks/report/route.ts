import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

function getDateRange(filter?: string, from?: string, to?: string) {
  const now = new Date();
  let start: Date | undefined;
  let end: Date | undefined;

  switch (filter) {
    case "today":
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date();
      break;
    case "yesterday":
      start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      break;
    case "week":
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      end = new Date();
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date();
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date();
      break;
    case "custom":
      if (from) start = new Date(from);
      if (to) {
        end = new Date(to);
        end.setHours(23, 59, 59, 999);
      }
      break;
    case "all":
    default:
      start = undefined;
      end = undefined;
  }

  return { start, end };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const productName = searchParams.get("productName") || undefined;

    const { start, end } = getDateRange(filter, from, to);

    const session = await auth.api.getSession({ headers: await headers() });
    const requestedBranchId = searchParams.get('branchId');
    
    // Use requested branchId if provided, otherwise use session branchId
    const branchId = requestedBranchId || session?.user?.branch;
    const whereClause = session?.user?.role === 'admin' ? 
      (requestedBranchId ? { branchId: requestedBranchId } : {}) : 
      { branchId };

    // Get pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;
    
    // For custom date range, disable pagination and return all data
    const isCustomDateRange = filter === 'custom' && (from || to);
    const finalLimit = isCustomDateRange ? undefined : limit;
    const finalSkip = isCustomDateRange ? undefined : skip;

    // Add date filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateFilter: any = {};
    if (start) dateFilter.gte = start;
    if (end) dateFilter.lte = end;

    // Get all purchases for the branch and date range
    const purchases = await prisma.purchase.findMany({
      where: {
        ...whereClause,
        ...(productName ? { productType: productName } : {}),
        date: dateFilter,
      },
      select: {
        id: true,
        productType: true,
        quantity: true,
        date: true,
        branchId: true,
      },
      orderBy: { date: "asc" },
    });

    // Get all meter readings for fuel products (sale qty)
    const meterReadings = await prisma.meterReading.findMany({
      where: {
        ...whereClause,
        ...(productName ? { fuelType: productName } : {}),
        date: dateFilter,
      },
      select: {
        id: true,
        fuelType: true,
        sale: true,
        date: true,
        branchId: true,
      },
      orderBy: { date: "asc" },
    });

    // Get all oil sales for other products (sale qty)
    const oilSales = await prisma.oil.findMany({
      where: {
        ...whereClause,
        ...(productName ? { productType: productName } : {}),
        date: dateFilter,
      },
      select: {
        id: true,
        productType: true,
        quantity: true,
        date: true,
        branchId: true,
      },
      orderBy: { date: "asc" },
    });

    // Get current stock levels
    const stocks = await prisma.stock.findMany({
      where: whereClause,
      select: {
        item: true,
        quantity: true,
        branchId: true,
      },
    });

    // Create a map of current stock by product
    const stockMap = new Map<string, number>();
    stocks.forEach(stock => {
      stockMap.set(stock.item, stock.quantity);
    });

    // Group by product and date
    const stockDataMap = new Map<string, {
      product: string;
      date: Date;
      purchaseQty: number;
      saleQty: number;
      balanceStock: number;
    }>();

    // Process purchases
    purchases.forEach(purchase => {
      const key = `${purchase.productType}_${purchase.date.toISOString().split('T')[0]}`;
      if (!stockDataMap.has(key)) {
        stockDataMap.set(key, {
          product: purchase.productType,
          date: purchase.date,
          purchaseQty: 0,
          saleQty: 0,
          balanceStock: 0,
        });
      }
      const entry = stockDataMap.get(key)!;
      entry.purchaseQty += purchase.quantity;
    });

    // Process meter readings (fuel sales)
    meterReadings.forEach(reading => {
      const key = `${reading.fuelType}_${reading.date.toISOString().split('T')[0]}`;
      if (!stockDataMap.has(key)) {
        stockDataMap.set(key, {
          product: reading.fuelType,
          date: reading.date,
          purchaseQty: 0,
          saleQty: 0,
          balanceStock: 0,
        });
      }
      const entry = stockDataMap.get(key)!;
      entry.saleQty += reading.sale || 0;
    });

    // Process oil sales (other products)
    oilSales.forEach(oil => {
      const key = `${oil.productType}_${oil.date.toISOString().split('T')[0]}`;
      if (!stockDataMap.has(key)) {
        stockDataMap.set(key, {
          product: oil.productType,
          date: oil.date,
          purchaseQty: 0,
          saleQty: 0,
          balanceStock: 0,
        });
      }
      const entry = stockDataMap.get(key)!;
      entry.saleQty += oil.quantity || 0;
    });

    // Convert map to array and add exact stock quantity for each product
    const stockReport = Array.from(stockDataMap.values()).map(entry => {
      // Get exact stock quantity for this product from Stock table
      const exactStock = stockMap.get(entry.product) || 0;
      
      return {
        ...entry,
        balanceStock: exactStock,
      };
    });

    // Sort final report by date descending (most recent first), then by product name
    stockReport.sort((a, b) => {
      // First sort by date (descending - most recent first)
      const dateDiff = b.date.getTime() - a.date.getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      // If dates are equal, sort by product name
      return a.product.localeCompare(b.product);
    });

    // Get total count before pagination
    const totalCount = stockReport.length;

    // Apply pagination
    const paginatedStockReport = isCustomDateRange 
      ? stockReport 
      : stockReport.slice(finalSkip, finalSkip !== undefined && finalLimit !== undefined ? finalSkip + finalLimit : undefined);

    const totalPages = isCustomDateRange ? 1 : Math.ceil(totalCount / limit);

    return NextResponse.json({ 
      data: paginatedStockReport,
      totalCount,
      pagination: isCustomDateRange ? undefined : {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching stock report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

